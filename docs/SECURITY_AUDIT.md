# Musica 2.0 — Comprehensive Security Audit & Threat Model

**Audit Date:** October 2026  
**Classification:** Internal Engineering Security Review  
**Scope:** Frontend Client, REST API, Socket.IO Signaling, WebRTC Engine, and Persistence Layer

---

## 1. Threat Modeling Overview

| Threat Vector | Severity | Vulnerability Description | Mitigation Strategy |
|---|---|---|---|
| **Plaintext Room Passwords** | **HIGH** | Passwords stored unhashed in `rooms.json` | Hash passwords with Argon2id/bcrypt before persistence |
| **Room Creation / Join Flooding** | **MEDIUM** | No rate limiting on `/api/rooms` and `/api/rooms/join` | Implement `express-rate-limit` + IP throttling |
| **Chat XSS & Script Injection** | **MEDIUM** | Chat text emitted directly without HTML escaping | Sanitize message bodies and enforce strict length bounds |
| **Impersonation on Reconnect** | **MEDIUM** | Host identified only by matching `userName` string | Cryptographic session tokens generated upon room creation |
| **Socket Event Flooding** | **LOW** | No debounce on reactions and hand raising | Per-socket sliding window rate limiting |
| **CORS Misconfiguration** | **LOW** | Permissive regex for LAN IP ranges | Strict origin validation in production deployments |

---

## 2. In-Depth Vulnerability Analysis & Mitigations

### 2.1 Password Security
- **Current State:** When a host sets a room password during room creation, it is stored as a plaintext string in `rooms.json` (`data.rooms[roomId].password = params.password`).
- **Risk:** Anyone with local or backup access to `rooms.json` can read room passwords.
- **Remediation Plan:**
  1. Introduce `bcryptjs` or `argon2` in `@musica/server`.
  2. Hash passwords with salt prior to saving in `rooms.json`.
  3. Validate join attempts using constant-time hash comparisons to prevent timing attacks.

### 2.2 Host Privilege Verification & Reconnect Tokens
- **Current State:** When a user connects over Socket.IO, the server matches `roomDetails.room.hostName.toLowerCase() === userName.toLowerCase()`.
- **Risk:** If a room has no password and an unauthorized user rejoins with the host's exact name string while the host is disconnected, they could be granted host privileges.
- **Remediation Plan:**
  1. Generate a secure random `hostAuthToken` when the room is created.
  2. Return `hostAuthToken` exclusively to the creator.
  3. Require `hostAuthToken` during `JOIN_ROOM` to claim the `host` role.

### 2.3 Rate Limiting & DoS Hardening
- **Current State:** Express routes `/api/rooms` and `/api/rooms/join` have no request rate caps.
- **Risk:** Automated scripts could generate thousands of empty rooms or brute-force 4-character room codes.
- **Remediation Plan:**
  1. Add `express-rate-limit`:
     - Room creation: max 10 rooms per 15 minutes per IP.
     - Join attempts: max 30 attempts per minute per IP.
  2. Add Socket.IO packet rate limiting for `chat-send`, `reaction-send`, and `raise-hand`.

### 2.4 Content Moderation & Input Sanitization
- **Current State:** Chat messages are checked for maximum length (`maxChatLength: 500`), but rendered in standard React text nodes.
- **Assessment:** React inherently escapes JSX text nodes (preventing classic DOM XSS), but payloads stored in logs or shared across future API integrations should be sanitized.
- **Remediation Plan:** Strip zero-width malicious characters, trim whitespace, and reject non-printable Unicode sequences.

### 2.5 WebRTC & TURN Security
- **Current State:** Public Google STUN servers (`stun:stun.l.google.com:19302`) are used for candidate discovery.
- **Recommendation:**
  1. When deploying coturn for symmetric NAT traversal, generate short-lived HMAC time-based TURN credentials.
  2. Never embed static TURN credentials in client-side bundle files.

---

## 3. Compliance & Security Checklists

- [x] Server-side privilege enforcement on all moderation actions (kick, ban, room lock).
- [x] Safe URL extraction prevents `javascript:` protocol exploits in YouTube parser.
- [x] Zero access to client filesystem or unauthorized operating system commands.
- [ ] Cryptographic password hashing (Argon2id/bcrypt) — *Scheduled for Phase 2*.
- [ ] Cryptographic host reconnection token — *Scheduled for Phase 2*.
- [ ] Express rate-limiting middleware — *Scheduled for Phase 2*.
- [ ] Audit logging of all administrative actions to tamper-evident logs — *Scheduled for Phase 2*.
