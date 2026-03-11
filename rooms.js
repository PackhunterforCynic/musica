// In-memory room store
const rooms = {};

function createRoom({ roomId, password, hostId, hostName }) {
  rooms[roomId] = {
    roomId,
    password,
    hostId,
    hostName,
    users: [{ id: hostId, name: hostName, role: "host" }],
    pendingRequests: [],
  };
  return rooms[roomId];
}

function getRoom(roomId) {
  return rooms[roomId] || null;
}

function addUser(roomId, user) {
  if (!rooms[roomId]) return false;
  rooms[roomId].users.push(user);
  return true;
}

function removeUser(roomId, userId) {
  if (!rooms[roomId]) return;
  rooms[roomId].users = rooms[roomId].users.filter((u) => u.id !== userId);
  // If room is empty or host left, delete room
  if (
    rooms[roomId].users.length === 0 ||
    rooms[roomId].hostId === userId
  ) {
    delete rooms[roomId];
    return "room_deleted";
  }
}

function addPendingRequest(roomId, request) {
  if (!rooms[roomId]) return false;
  rooms[roomId].pendingRequests.push(request);
  return true;
}

function removePendingRequest(roomId, userId) {
  if (!rooms[roomId]) return;
  rooms[roomId].pendingRequests = rooms[roomId].pendingRequests.filter(
    (r) => r.userId !== userId
  );
}

function getUsersInRoom(roomId) {
  if (!rooms[roomId]) return [];
  return rooms[roomId].users;
}

module.exports = {
  createRoom,
  getRoom,
  addUser,
  removeUser,
  addPendingRequest,
  removePendingRequest,
  getUsersInRoom,
};
