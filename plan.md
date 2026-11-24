# Musica — Product & Engineering Development Plan

> **Real-Time Communication, Streaming, Collaboration & Remote Support Platform**

**Project:** Musica  
**Version:** 1.0  
**Status:** In Active Development  
**Architecture:** TypeScript Monorepo (`shared/`, `server/`, `client/`)  
**Deployment:** Vercel (Client) + Render (Server) + LiveKit Cloud (Media SFU) + Supabase (Auth & Postgres)  
**Source Control:** Git + GitHub (`PackhunterforCynic/musica`)

---

## 1. Project Overview

### 1.1 What is Musica?
Musica is a real-time communication and collaboration platform designed for private conversations, podcasts, online classrooms, live screen sharing, and remote technical support.

Rather than creating separate siloed applications for each use case, Musica provides configurable room experiences powered by a common real-time infrastructure (LiveKit SFU + Supabase Auth & PostgreSQL + Express REST API).

### 1.2 Main Product Experiences

Musica supports four primary room experiences:

| Experience | Capacity | Primary Purpose | Key Features |
|---|---:|---|---|
| **Private Room** | Exactly 2 | 1-to-1 video/audio calls | Encrypted audio/video, screen sharing with audio, private chat, session timer, file sharing |
| **Podcast Room** | Configurable (e.g. 10 speakers + audience) | Multi-participant audio/video streaming | Host/Co-host/Speaker/Listener roles, raise hand, moderator controls, recording, audience chat |
| **Classroom** | Configurable (e.g. 1 teacher + 50 students) | Interactive online education | Teacher presentation stage, student grid, whiteboard, attendance, raise-hand queue, polls |
| **Remote Support** | Exactly 2 (Customer + Tech) | Browser-based screen viewing & guidance | Screen viewing, technician voice, pointer/annotations, explicit consent & termination banner |

---

## 2. Technology Stack

### 2.1 Frontend (`client/`)
- **React 19** + **Vite**: Ultra-fast component rendering and HMR.
- **TypeScript**: End-to-end type safety.
- **Tailwind CSS v4**: Utility-first styling with custom studio design tokens.
- **Motion for React (`motion/react`)**: Smooth layout transitions (`layout`, `layoutId`), exit animations (`AnimatePresence`), and accessible reduced-motion support.
- **LiveKit Client SDK (`livekit-client`, `@livekit/components-react`)**: SFU track subscriptions, publishing, active speaker detection, and data packets.
- **Supabase JS (`@supabase/supabase-js`)**: User authentication and persistent profiles.
- **Zustand**: Reactive state management for room state, chat, participants, and playback synchronization.
- **Lucide React**: Clean, modern studio iconography.

### 2.2 Backend (`server/`)
- **Node.js** + **Express.js**: REST API with typed controllers and middleware.
- **LiveKit Server SDK (`livekit-server-sdk`)**: Cryptographic JWT access token generation, room lifecycle management, and webhook verification.
- **Supabase Admin Client**: Service-role verification, user profile CRUD, and session history logging.
- **Socket.IO**: Authoritative real-time application events (queue changes, host transitions, moderation).
- **TypeScript**: Strict compile-time validation.

### 2.3 Media & Data Infrastructure
- **LiveKit Cloud SFU**: Low-latency global media routing for audio, video, screen shares, and speaking indicators.
- **Supabase Cloud**: Authentication, PostgreSQL database, and Row Level Security (RLS).
- **Zero-DB File Store**: High-performance local transactional storage for in-memory room lifecycle and recovery.

---

## 3. Core Architecture & Security Principles

1. **Least-Privilege Token Issuance**: The frontend never receives Supabase service-role keys or LiveKit API secrets. Express acts as the authoritative gatekeeper.
2. **Server-Side Role & Capacity Enforcement**: The backend validates room type limits (e.g. max 2 for Private & Remote Support) and assigns cryptographic LiveKit permissions (`canPublish`, `canSubscribe`, `roomAdmin`).
3. **Explicit Consent in Remote Support**: Browser-based screen sharing requires explicit user authorization. A persistent "Sharing Active - Stop Sharing" control is visible at all times.
4. **Motion with Restraint**: UI animations provide functional feedback (participant join/leave layout rearrangement, speaking glow indicators, panel drawers) rather than distracting continuous movement.
5. **Preservation of Existing Infrastructure**: Upgrades build upon the validated monorepo (`shared/`, `server/`, `client/`) preserving existing YouTube watch parties, collaborative queues, and LiveKit 2.0 SFU capabilities.

---

## 4. Visual Identity & Token System (`/fskills`)

Musica uses a studio-grade, dark-first visual identity inspired by high-end broadcasting suites:

- **Background:** `#0B1020` (Deep Studio Slate)
- **Surface:** `#151C2E` (Elevated Deck Surface)
- **Border / Divider:** `rgba(255, 255, 255, 0.08)`
- **Primary Brand:** `#8B5CF6` (Studio Violet)
- **Secondary Accent:** `#22D3EE` (Stream Cyan)
- **Live / On-Air:** `#22C55E` (Emerald Green)
- **Attention / Alert:** `#F97316` (Broadcast Amber)
- **Text Primary:** `#E5E7EB` (Clean Off-White)
- **Text Muted:** `#64748B` (Cool Slate)

---

## 5. Implementation Roadmap

- [x] **Phase 0 — Monorepo & Media Upgrade:** WebRTC mesh replaced with LiveKit Cloud SFU; Express token service and LiveKit client manager established.
- [x] **Phase 1 — Identity & Persistence:** Supabase Auth and client integration, user profiles, room session logging, and DDL schema.
- [x] **Phase 2 — UI/UX Studio Overhaul & Motion System:** Design token system, Motion for React transitions, Studio Dashboard, and adaptive Live Room Shell.
- [x] **Phase 3 — 4 Distinct Room Experiences:**
  - Private Room Stage (1-to-1)
  - Podcast Studio Stage (Host/speaker/listener, raise hand)
  - Interactive Classroom Stage (Teacher stage, student gallery, raise hand, whiteboard/notes)
  - Remote Technical Support Stage (Screen view, pointer overlay, consent control)
- [ ] **Phase 4 — Production Hardening & CI/CD:** Vercel frontend, Render backend, GitHub Actions automated verification.
