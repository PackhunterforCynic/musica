# Musica REST & WebSocket API Specification

> **Musica Control Plane API Reference**  
> REST Endpoints, Authentication, LiveKit Token Service, and Socket.IO Protocol.

---

## 1. Authentication & Security Headers

All protected endpoints require an `Authorization` header containing a valid Supabase JWT Bearer token:

```http
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json
```

The server verifies the JWT signature asymmetrically against `SUPABASE_JWKS_URL` using `@supabase/supabase-js` or JSON Web Key Sets.

---

## 2. REST Endpoints Catalog

### 2.1 Diagnostics & Health
#### `GET /health`
Returns system health, server uptime, and timestamp.
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 1420.5,
  "timestamp": "2026-11-24T09:30:00.000Z"
}
```

### 2.2 Room Management
#### `POST /api/rooms`
Creates a new room session with server-authoritative capacity and room type validation.
- **Request Body**:
```json
{
  "roomName": "Daily Engineering Standup",
  "hostName": "Alex Rivera",
  "roomType": "podcast",
  "password": "optional_secure_passcode",
  "maxParticipants": 25,
  "category": "education",
  "visibility": "public"
}
```
- **Validation Rules**:
  - `private` and `remote-support` rooms are strictly capped at `maxParticipants: 2`.
  - Passwords are automatically hashed via bcrypt.
- **Response `201 Created`**:
```json
{
  "success": true,
  "room": {
    "roomId": "STRM-92KA",
    "roomName": "Daily Engineering Standup",
    "roomType": "podcast",
    "hostName": "Alex Rivera",
    "hostAuthToken": "sec_82fa9b4...",
    "locked": false,
    "maxParticipants": 25,
    "status": "active",
    "participants": []
  }
}
```

#### `GET /api/rooms`
Lists active public rooms.
- **Response `200 OK`**:
```json
{
  "success": true,
  "rooms": [ ... ]
}
```

#### `GET /api/rooms/:id`
Retrieves live state for a specific room.
- **Response `200 OK`** or `404 Not Found`.

### 2.3 LiveKit SFU Token Issuance
#### `POST /api/rooms/token`
Generates a cryptographically signed LiveKit Access Token with experience-specific permissions.
- **Request Body**:
```json
{
  "roomId": "STRM-92KA",
  "userName": "Alex Rivera",
  "role": "host",
  "password": "optional_passcode"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "serverUrl": "wss://musica-t6p6knyc.livekit.cloud",
  "roomName": "STRM-92KA",
  "participantIdentity": "Alex Rivera-1732431200",
  "participantName": "Alex Rivera",
  "role": "host"
}
```

### 2.4 User Profiles
#### `GET /api/auth/me`
Fetches authenticated user profile from Supabase.
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "user": {
    "id": "usr_912384a...",
    "email": "alex@example.com",
    "username": "alexr",
    "displayName": "Alex Rivera"
  }
}
```

---

## 3. Real-Time Socket.IO Protocol

### 3.1 Client-to-Server Events

| Event Name | Payload Format | Description |
|---|---|---|
| `join-room` | `{ roomId, userName, password?, role? }` | Requests entry into a room |
| `leave-room` | `{ roomId }` | Gracefully disconnects from a room |
| `chat-send` | `{ roomId, text }` | Broadcasts text chat message |
| `reaction-send` | `{ roomId, emoji }` | Broadcasts floating emoji reaction |
| `raise-hand` | `{ roomId }` | Requests to speak |
| `lower-hand` | `{ roomId }` | Withdraws speaking request |
| `support-annotation-create` | `{ roomId, annotation }` | Sends laser pointer coordinates |
| `support-annotations-clear` | `{ roomId }` | Clears all active laser points |
| `classroom-poll-vote` | `{ roomId, pollId, optionIndex }` | Submits student vote |
| `podcast-promote-speaker` | `{ roomId, participantId }` | Host promotes listener to speaker |

### 3.2 Server-to-Client Events

| Event Name | Payload Format | Description |
|---|---|---|
| `room-joined-success` | `{ room, participantId, role }` | Sent on successful room join |
| `participant-joined` | `Participant` | Broadcast when new user enters |
| `participant-left` | `{ participantId, name }` | Broadcast when user leaves |
| `support-annotation-broadcast` | `SupportAnnotation` | Real-time laser coordinates |
| `classroom-poll-broadcast` | `ClassroomPoll` | Updated aggregate quiz results |
| `host-disconnected-recovery` | `{ gracePeriodSeconds }` | Notifies room of 60s host grace |
| `host-recovered-success` | `{ hostName }` | Notifies room that host reconnected |
| `room-ended-by-host` | `{ reason }` | Forces all clients to exit room |
