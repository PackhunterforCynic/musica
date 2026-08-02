# Musica SFU Migration Guide

## Executive Summary
Musica is currently engineered with a **Peer-to-Peer (P2P) WebRTC Mesh** signaling model over Socket.IO, accompanied by a **Zero-Database Atomic JSON Storage** layer. This architecture provides zero operational database maintenance and minimal media server bandwidth for small-to-medium study rooms and classes (up to 50 participants).

As broadcasting audiences scale beyond 50+ concurrent viewers per session, upload bandwidth requirements for a single broadcast host increase linearly in P2P mesh topologies ($N-1$ outbound streams). To support enterprise scale (1,000+ viewers), Musica’s modular architecture has been built specifically for drop-in migration to a **Selective Forwarding Unit (SFU)** such as **Mediasoup**, **LiveKit**, or **Janus**.

---

## 1. Modular Separation of Concerns
Our WebRTC client layer in `/client/src/webrtc` isolates signaling and stream management into targeted classes:
- `MediaManager.ts`: Handles hardware capabilities, display capture, and Web Audio mixing. **(Zero changes required for SFU)**
- `ConnectionManager.ts` & `ICEManager.ts`: Monitors telemetry and candidate trickling. **(Zero changes required for SFU)**
- `PeerManager.ts`: Coordinates local and remote `RTCPeerConnection` instances. **(Single adaptation point)**
- `useWebRTCStudio.ts`: Reactive React binding hook to state store. **(Zero UI changes required for SFU)**

---

## 2. Migration Path: Replacing `PeerManager.ts` with an SFU Transport

### Existing P2P Mesh Pattern:
```
[Host Browser] -------- Offer/Answer (Socket.IO) --------> [Audience Peer 1]
[Host Browser] -------- Offer/Answer (Socket.IO) --------> [Audience Peer 2]
```

### Future SFU Transport Pattern (e.g., Mediasoup / LiveKit):
```
[Host Browser] ---- Single Send Transport (SDP) ----> [SFU Media Node] ---- Multiple Recv Transports ----> [Audience Peers]
```

### Required Refactoring Steps:
1. **Server-Side Signaling Additions:**
   In `/server/src/socket/SocketService.ts`, replace raw P2P relay events (`WEBRTC_OFFER`, `WEBRTC_ANSWER`, `WEBRTC_ICE_CANDIDATE`) with SFU Transport Handshake handlers:
   - `sfu:createTransport`: Returns SFU router capabilities and DTLS parameters.
   - `sfu:connectTransport`: Connects client WebRTC transport to SFU router.
   - `sfu:produce`: Host publishes single combined audio/video track.
   - `sfu:consume`: Audience consumes host's single published stream from the SFU router.

2. **Client-Side `PeerManager.ts` Adaptation:**
   Instead of maintaining a `Map<string, RTCPeerConnection>` for every individual participant socket ID:
   - Host initializes **1 Send Transport** to the SFU router via `sfu:produce`.
   - Audience initializes **1 Receive Transport** from the SFU router via `sfu:consume`.
   - All room chat, presence, hand-raise chimes, reaction bursts, and 60-second host disconnect recovery windows continue operating identically over Socket.IO and the atomic JSON storage engine without modification.

---

## 3. Database Independence
Even after integrating an SFU media layer, Musica remains **100% Database-Free**. The atomic JSON persistence queue (`rooms.json`, `sessions.json`, `logs.json`) continues to safely store room metadata, participant rosters, and platform health telemetry without requiring PostgreSQL or MongoDB.
