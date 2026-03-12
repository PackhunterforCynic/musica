require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const {
    createRoom,
    getRoom,
    addUser,
    removeUser,
    addPendingRequest,
    removePendingRequest,
    getUsersInRoom,
} = require("./rooms");

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// Map socketId -> { roomId, userId, name, role }
const socketMap = {};

io.on("connection", (socket) => {
    console.log(`[+] Socket connected: ${socket.id}`);

    // ─── CREATE ROOM ────────────────────────────────────────────────────────────
    socket.on("create_room", ({ password, hostName }, callback) => {
        const roomId = uuidv4().slice(0, 8).toUpperCase();
        const hostId = socket.id;

        const room = createRoom({ roomId, password, hostId, hostName });
        socket.join(roomId);

        socketMap[socket.id] = { roomId, userId: hostId, name: hostName, role: "host" };

        console.log(`[Room] Created: ${roomId} by ${hostName}`);
        callback({ success: true, roomId, room });
    });

    // ─── REQUEST JOIN ────────────────────────────────────────────────────────────
    socket.on("request_join", ({ roomId, password, userName }, callback) => {
        const room = getRoom(roomId);

        if (!room) return callback({ success: false, error: "Room not found" });
        if (room.password && room.password !== password)
            return callback({ success: false, error: "Wrong password" });

        const request = { userId: socket.id, userName };
        addPendingRequest(roomId, request);

        // Store temporarily
        socketMap[socket.id] = { roomId, userId: socket.id, name: userName, role: "listener" };

        // Notify host
        const hostSocket = room.hostId;
        io.to(hostSocket).emit("join_request", { userId: socket.id, userName });

        callback({ success: true, waiting: true });
        console.log(`[Join] ${userName} requested to join ${roomId}`);
    });

    // ─── APPROVE / REJECT USER ──────────────────────────────────────────────────
    socket.on("approve_user", ({ userId, approved }) => {
        const meta = socketMap[socket.id];
        if (!meta) return;
        const room = getRoom(meta.roomId);
        if (!room || room.hostId !== socket.id) return;

        const req = room.pendingRequests.find((r) => r.userId === userId);
        if (!req) return;

        removePendingRequest(meta.roomId, userId);

        if (approved) {
            addUser(meta.roomId, { id: userId, name: req.userName, role: "listener" });
            // Let the listener join the socket room
            const listenerSocket = io.sockets.sockets.get(userId);
            if (listenerSocket) listenerSocket.join(meta.roomId);

            // Tell the listener they're approved
            io.to(userId).emit("join_approved", {
                roomId: meta.roomId,
                users: getUsersInRoom(meta.roomId),
                hostId: room.hostId,
            });

            // Tell everyone in room a new user joined
            io.to(meta.roomId).emit("user_joined", {
                userId,
                name: req.userName,
                users: getUsersInRoom(meta.roomId),
            });

            console.log(`[Join] Approved: ${req.userName} in ${meta.roomId}`);
        } else {
            io.to(userId).emit("join_rejected", { roomId: meta.roomId });
            console.log(`[Join] Rejected: ${req.userName}`);
        }
    });

    // ─── WEBRTC SIGNALING ───────────────────────────────────────────────────────
    socket.on("offer", ({ targetId, offer }) => {
        io.to(targetId).emit("offer", { fromId: socket.id, offer });
    });

    socket.on("answer", ({ targetId, answer }) => {
        io.to(targetId).emit("answer", { fromId: socket.id, answer });
    });

    socket.on("ice_candidate", ({ targetId, candidate }) => {
        io.to(targetId).emit("ice_candidate", { fromId: socket.id, candidate });
    });

    // Host broadcasts "started streaming" to all listeners
    socket.on("stream_started", () => {
        const meta = socketMap[socket.id];
        if (!meta) return;
        socket.to(meta.roomId).emit("host_stream_started", { hostId: socket.id });
        console.log(`[Stream] Host started in room ${meta.roomId}`);
    });

    socket.on("stream_stopped", () => {
        const meta = socketMap[socket.id];
        if (!meta) return;
        socket.to(meta.roomId).emit("host_stream_stopped");
        console.log(`[Stream] Host stopped in room ${meta.roomId}`);
    });

    // Listener tells server it's ready for WebRTC; server forwards to host
    socket.on("listener_ready_signal", ({ hostId }) => {
        io.to(hostId).emit("listener_ready", { listenerId: socket.id });
        console.log(`[WebRTC] Listener ${socket.id} ready, notifying host ${hostId}`);
    });

    // ─── CHAT ───────────────────────────────────────────────────────────────────
    socket.on("send_message", ({ message }) => {
        const meta = socketMap[socket.id];
        if (!meta) return;
        const payload = {
            id: uuidv4(),
            userId: socket.id,
            name: meta.name,
            message,
            timestamp: Date.now(),
        };
        io.to(meta.roomId).emit("new_message", payload);
    });

    // ─── REACTIONS ──────────────────────────────────────────────────────────────
    socket.on("reaction", ({ emoji }) => {
        const meta = socketMap[socket.id];
        if (!meta) return;
        io.to(meta.roomId).emit("new_reaction", {
            userId: socket.id,
            name: meta.name,
            emoji,
        });
    });

    // ─── STICKERS ───────────────────────────────────────────────────────────────
    socket.on("send_sticker", ({ sticker }) => {
        const meta = socketMap[socket.id];
        if (!meta) return;
        io.to(meta.roomId).emit("new_sticker", {
            userId: socket.id,
            name: meta.name,
            sticker,
        });
    });

    // ─── LEAVE ROOM ─────────────────────────────────────────────────────────────
    socket.on("leave_room", () => {
        handleDisconnect(socket);
    });

    // ─── DISCONNECT ─────────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
        console.log(`[-] Socket disconnected: ${socket.id}`);
        handleDisconnect(socket);
    });
});

function handleDisconnect(socket) {
    const meta = socketMap[socket.id];
    if (!meta) return;

    const result = removeUser(meta.roomId, meta.userId);

    if (result === "room_deleted") {
        io.to(meta.roomId).emit("room_closed", { message: "Host left the room" });
    } else {
        io.to(meta.roomId).emit("user_left", {
            userId: meta.userId,
            name: meta.name,
            users: getUsersInRoom(meta.roomId),
        });
    }

    delete socketMap[socket.id];
}

server.listen(PORT, () => {
    console.log(`🎵 Musica server running on http://localhost:${PORT}`);
});
