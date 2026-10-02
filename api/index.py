import os
import json
import time
import random
import string
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import socketio

# Ensure data directory exists (use /tmp on Vercel)
DATA_DIR = "/tmp/musica-data" if os.getenv("VERCEL") else os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

# Helper functions for atomic JSON storage
def read_json(filename, default):
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        return default
    try:
        with open(path, "r") as f:
            return json.load(f)
    except:
        return default

def write_json(filename, data):
    path = os.path.join(DATA_DIR, filename)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

# Create FastAPI app
fastapi_app = FastAPI(title="Musica API (Python/Vercel)")

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Models
class CreateRoomRequest(BaseModel):
    hostName: str
    roomName: str
    password: str = ""
    maxParticipants: int = 50

class JoinRoomRequest(BaseModel):
    roomId: str
    name: str
    password: str = ""

# API Endpoints
@fastapi_app.get("/api/health")
async def health():
    return {"status": "healthy (python backend)", "timestamp": time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())}

@fastapi_app.post("/api/rooms")
async def create_room(req: CreateRoomRequest):
    rooms_data = read_json("rooms.json", {"rooms": {}})
    room_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    room = {
        "roomId": room_id,
        "roomName": req.roomName,
        "hostName": req.hostName,
        "password": req.password,
        "maxParticipants": req.maxParticipants,
        "locked": False,
        "status": "active",
        "createdAt": time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime()),
        "screenShareState": "Idle",
        "hostId": None
    }
    rooms_data["rooms"][room_id] = room
    write_json("rooms.json", rooms_data)
    
    return {"success": True, "roomId": room_id, "room": room}

@fastapi_app.post("/api/rooms/join")
async def join_room(req: JoinRoomRequest):
    room_id = req.roomId.strip().upper()
    rooms_data = read_json("rooms.json", {"rooms": {}})
    room = rooms_data["rooms"].get(room_id)
    
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
        
    if room["password"] and room["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid password")
        
    return {
        "success": True,
        "roomId": room["roomId"],
        "roomName": room["roomName"],
        "hostName": room["hostName"],
        "participantId": f"temp-{int(time.time() * 1000)}"
    }

@fastapi_app.get("/api/rooms/{roomId}")
async def get_room(roomId: str):
    room_id = roomId.strip().upper()
    rooms_data = read_json("rooms.json", {"rooms": {}})
    room = rooms_data["rooms"].get(room_id)
    
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
        
    return {
        "roomId": room["roomId"],
        "roomName": room["roomName"],
        "hostName": room["hostName"],
        "participants": 1,
        "maxParticipants": room["maxParticipants"],
        "locked": room["locked"],
        "status": room["status"],
        "screenShareState": room.get("screenShareState", "Idle"),
        "isRecovering": False
    }

@fastapi_app.get("/api/stats")
async def get_stats():
    return {"success": True, "stats": {"totalRooms": 1, "activeRooms": 1, "totalParticipants": 1, "peakParticipants": 1}}


# --- Socket.IO Real-time Signaling ---
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

@sio.event
async def connect(sid, environ):
    print(f"[Socket] Connected: {sid}")

@sio.event
async def JOIN_ROOM(sid, data):
    room_id = data.get("roomId", "").strip().upper()
    user_name = data.get("name", "").strip()
    await sio.enter_room(sid, room_id)
    
    rooms_data = read_json("rooms.json", {"rooms": {}})
    room = rooms_data["rooms"].get(room_id, {})
    
    role = "host" if user_name.lower() == room.get("hostName", "").lower() else "audience"
    
    participant = {
        "id": sid,
        "name": user_name,
        "role": role,
        "roomId": room_id,
        "presence": "Speaking",
        "handRaised": False
    }
    
    await sio.emit("ROOM_JOINED_SUCCESS", {
        "room": room,
        "localParticipant": participant,
        "participants": [participant],
        "isRecovering": False
    }, to=sid)
    
    await sio.emit("PARTICIPANT_JOINED", {"participant": participant}, room=room_id, skip_sid=sid)

@sio.event
async def CHAT_SEND(sid, data):
    pass # To be fully implemented for production

@sio.event
async def disconnect(sid):
    print(f"[Socket] Disconnected: {sid}")

# Create the ASGI app which includes both FastAPI and SocketIO
# Vercel will look for the `app` variable
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
