# Musica Architecture & Operational Invariants

## 1. Split-Cloud API Routing (Vercel + Render)
- When frontend is deployed to static platforms (e.g., `*.vercel.app`), API endpoints and Socket.IO MUST explicitly target the live backend host (`https://musica-ek31.onrender.com`), never `window.location.origin`.
- Always provide resilient fallback URLs so endpoints never default to `localhost` in production.

## 2. Real-Time Access Control Defaults
- Waiting room approval (`requireApproval`) MUST default to `false`.
- Only gate users in the lobby if `room.settings?.requireApprovalToJoin === true`.

## 3. Production Node TypeScript Dependencies
- In Node subpackages built in production (e.g. Render with `NODE_ENV=production`), all build-time types (`@types/*`) and compilers (`typescript`, `tsx`) MUST be declared in `dependencies`, not `devDependencies`.
- Never use obsolete tsconfig options (`baseUrl: "."`, `moduleResolution: "node10"`).

## 4. Windows PowerShell Tool Execution
- Never chain bash-style `&&` in Windows PowerShell commands. Use `;` or issue separate commands.

## 5. Zero Dummy Data Invariant
- All participants, audio/video streams, chat messages, notes, and metrics MUST be bound directly to reactive state (`useRoomStore`, LiveKit events, or Supabase real-time). Never leave mock objects or static hardcoded lists in stage components.
