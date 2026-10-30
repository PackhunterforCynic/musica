# Musica 2.0 — Architecture Audit & System Inventory

**Audit Date:** October 2026  
**Auditor:** Principal Software Architect & Senior Engineering Team  
**System Version:** Musica 1.0 (Targeting 2.0 Architecture)  
**Repository State:** Monorepo (`shared/`, `server/`, `client/`)

---

## 1. Executive Summary

Musica is an interactive real-time social listening, watch party, and audio/screen broadcasting platform. This audit inspects the existing architecture across all workspaces, identifies working capabilities, documents technical debt, pinpoints architectural bottlenecks, and provides the baseline for the Musica 2.0 evolution.

---

## 2. Codebase Topology & Component Inventory

```
musica/
├── package.json               # Root monorepo workspace configuration (npm workspaces)
├── shared/                    # Universal TypeScript contracts
│   ├── src/types.ts           # Room, Participant, ChatMessage, YouTubeSyncPayload
│   ├── src/events.ts          # SOCKET_EVENTS dictionary
│   ├── src/permissions.ts     # Role-based permissions matrix
│   ├── src/schemas.ts         # JSON file store schemas
│   └── src/errors.ts          # Custom AppError hierarchy
├── server/                    # Node.js + Express + Socket.IO Backend
│   ├── src/index.ts           # Server bootstrap, HTTP + WebSocket listener, static client serve
│   ├── src/config/            # appConfig, limitsConfig, socketConfig, webrtcConfig
│   ├── src/routes/            # Express REST controllers (roomRoutes.ts)
│   ├── src/services/          # StorageService, RoomService, ParticipantService, LoggerService
│   ├── src/socket/            # SocketService.ts (event router and signaling relay)
│   └── src/utils/             # idGenerator.ts (4-character room codes)
├── client/                    # React 19 + Vite 8 + Tailwind CSS v4 Frontend
│   ├── src/main.tsx           # BrowserRouter entrypoint
│   ├── src/App.tsx            # Routes (/create, /create-couple, /join, /room/:id)
│   ├── src/pages/             # LandingPage, CreateRoomPage, JoinRoomPage, RoomPage
│   ├── src/components/
│   │   ├── studio/            # HostDashboard, AudienceInterface, CoupleRoomInterface,
│   │   │                      # SyncedYouTubePlayer, MediaStage, ControlDock, Sidebar
│   │   ├── common/            # ToastContainer, ReactionsOverlay
│   │   └── layout/            # Navbar, Footer
│   ├── src/store/             # Zustand roomStore.ts
│   ├── src/webrtc/            # PeerManager, MediaManager, ICEManager, ConnectionManager
│   └── src/utils/             # youtube.ts, formatters.ts, browserCompat.ts
└── data/                      # Zero-DB Atomic JSON storage files
    ├── rooms.json
    ├── participants.json
    ├── sessions.json
    ├── bans.json
    └── statistics.json
```

---

## 3. Existing Working Functionality

1. **4-Character Room Codes**: Cryptographically seeded generator creates unambiguous 4-character codes (excluding `0, O, 1, I`) with real-time disk collision checks.
2. **Room Modes**:
   - **Studio Broadcast**: 1 Host to $N$ Audience with screen share, mic audio, YouTube sync, chat, and hand-raising.
   - **Couple Mode**: P2P 1-on-1 bidirectional audio/video call.
3. **Session Resilience**:
   - `RoomRoute` backed by `sessionStorage` (`musica_session_XXXX`) guarantees no kicks on browser refresh.
   - Server-side 60-second host recovery grace period (`sessions.json`) preserves room state during host reconnection.
4. **Authoritative YouTube Watch Party**:
   - Embedded using `SyncedYouTubePlayer` with YouTube IFrame Player API (`enablejsapi=1`).
   - Host controls: Play, Pause, seek (`-10s` / `+10s`), time tracker, and "Sync All".
   - Heartbeat sync (every 3 seconds) and instant action broadcasting via `YOUTUBE_SYNC_STATE` / `YOUTUBE_SYNC_UPDATED`.
   - Late-joiner synchronization restoring video ID, elapsed time, and play state.
   - URL parser accepting full YouTube links, mobile links, `youtu.be`, shorts, and raw IDs.
5. **Waiting Room & Access Control**:
   - Optional room passwords.
   - Room lock/unlock toggle.
   - Audience waiting lobby with host admit/deny controls.
   - Real-time kick and ban enforcement.
6. **Social Engagement**:
   - Real-time room chat with unread badges and auto-scroll.
   - Hand-raising with chime notifications.
   - Floating emoji reactions with canvas confetti.
7. **Mobile Optimization**:
   - Automatic detection of mobile browser constraints (where `getDisplayMedia` is prohibited by OS).
   - Dedicated mobile Watch Together standby view.
   - Responsive touch UI with fixed bottom navigation bar and drawer panels.

---

## 4. Technical Debt & Deficiencies

### A. WebRTC Mesh Architecture Limits
- **Issue:** WebRTC is presently peer-to-peer mesh. The host encodes and transmits a dedicated stream to every audience member.
- **Impact:** Host outbound bandwidth scales linearly: $\mathcal{O}(N)$. Beyond 10–15 viewers, browser encoding stalls, dropping frames and causing network saturation.
- **Solution:** Migrate to a Selective Forwarding Unit (SFU) architecture using LiveKit while preserving the existing P2P mesh as a fallback.

### B. Persistence Layer (Zero-DB JSON)
- **Issue:** State is stored in serialized `.json` files on disk via `StorageService.ts` using atomic writes (`fs.promises.writeFile(tempPath) -> rename`).
- **Impact:** Disk I/O bottlenecks under high write volume; inability to run multi-instance clusters; risk of file locking collisions under distributed scaling.
- **Solution:** Introduce a database abstraction layer with PostgreSQL (Prisma ORM) for durable records and Redis for ephemeral presence and real-time playback snapshots.

### C. Monolithic Frontend Store
- **Issue:** `client/src/store/roomStore.ts` contains all state domains in a single 250+ line Zustand store (room info, participants, chat, media tracks, telemetry, YouTube sync, waiting room).
- **Impact:** Frequent re-renders of unrelated UI components when transient properties (telemetry, heartbeat) update.
- **Solution:** Partition into domain-specific stores (`room.store`, `chat.store`, `player.store`, `media.store`, `auth.store`).

### D. Server Logic Monolith
- **Issue:** `server/src/socket/SocketService.ts` handles all room joins, chat, moderation, WebRTC signaling, and YouTube sync in one 500+ line class.
- **Impact:** High coupling, difficult unit testing, and risk of regressions when modifying one feature.
- **Solution:** Split into specialized service handlers: `ChatService`, `ModerationService`, `PlaybackSyncService`, and `SignalingService`.

---

## 5. Performance & Mobile Assessment

| Area | Current Behavior | Bottleneck / Risk | Remediation |
|---|---|---|---|
| **Video Streaming** | P2P Mesh | Host bandwidth exhausts at $>10$ peers | LiveKit SFU integration |
| **YouTube Playback** | IFrame API + postMessage | Mobile autoplay policies require initial user tap | Clean "Tap to Unmute/Play" overlay on mobile |
| **Bundle Size** | Vite client bundle ~395 kB | Single chunk for all views | React.lazy route code-splitting |
| **Persistence I/O** | Atomic JSON files | Multi-server concurrency impossible | PostgreSQL + Redis migration |
| **State Updates** | Single Zustand store | Unnecessary re-renders on heartbeat | Domain-partitioned stores + shallow selectors |

---

## 6. Audit Conclusion
Musica possesses a clean, working foundation with working real-time primitives (4-char rooms, YouTube sync, WebRTC audio/screen share, waiting room). The path to Musica 2.0 requires modularizing the backend, introducing an SFU media abstraction, adding collaborative music queueing, establishing user authentication, and preparing scalable database/Redis infrastructure.
