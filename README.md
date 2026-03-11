# 🎵 Musica

A real-time audio sharing + social listening platform. Stream system audio to anyone on your local network — with live chat, emoji reactions, and a host approval flow.

> **Concept:** One device streams audio via WebRTC → others listen with reactions & chat. Think Spotify Group Session + Discord Stage, running on your own WiFi.

---

## Features

- 🎙️ **Live Audio Streaming** — host captures tab/screen audio via `getDisplayMedia`, streamed to all listeners over WebRTC
- 🔒 **Room System** — UUID room IDs, optional password, host approval for join requests
- 💬 **Real-time Chat** — Socket.io powered chat with gradient message bubbles
- 🔥 **Emoji Reactions** — 👍 ❤️ 🔥 😂 🎧 with floating animations
- 👥 **User List** — live list of listeners with host/listener badges
- 🌐 **Local Network First** — works on any device on the same WiFi

---

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | Next.js 14, TypeScript, TailwindCSS |
| Backend | Node.js, Express, Socket.io |
| Streaming | WebRTC (RTCPeerConnection) |
| Realtime | Socket.io (signaling, chat, reactions) |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/PackhunterforCynic/musica.git
cd musica

# Install backend deps
npm install

# Install frontend deps
cd musica-client
npm install
```

### 2. Run the backend

```bash
# In musica/ root
node server.js
# → http://localhost:5000
```

### 3. Run the frontend

```bash
# In musica/musica-client
npm run dev
# → http://localhost:3000
```

### 4. Local network (multi-device)

Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

Update `musica-client/.env.local`:
```
NEXT_PUBLIC_BACKEND_URL=http://192.168.x.x:5000
```

Other devices open: `http://192.168.x.x:3000`

---

## Project Structure

```
musica/
├── server.js          # Express + Socket.io backend
├── rooms.js           # In-memory room store
├── .env               # Backend config
└── musica-client/     # Next.js frontend
    ├── app/
    │   ├── page.tsx           # Home page
    │   └── room/[roomId]/     # Room page
    ├── components/            # UI components
    ├── hooks/                 # useWebRTC, useChat, useReactions
    └── lib/socket.ts          # Socket.io client singleton
```

---

## Roadmap

- [ ] STUN/TURN servers for internet streaming
- [ ] Spotify metadata integration
- [ ] Mobile PWA support
- [ ] Room recording
- [ ] Host moderation controls (kick, mute chat)
- [ ] React Native mobile app
