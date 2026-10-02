# 📻 Musica Studio – InfinityFree & LAMP PHP Deployment Guide

This package (`php-app/`) is a **100% self-contained PHP & WebRTC real-time broadcasting application** designed specifically for free shared hosting providers like **InfinityFree (iFastNet / Apache / cPanel)**.

## ✨ Why this works seamlessly on InfinityFree:
- **No Node.js or WebSocket Daemons Required:** InfinityFree restricts command-line execution and persistent custom socket loops. This application replaces heavy Socket.IO daemons with an **asynchronous HTTP Polling Engine (`api/poll.php`)** that uses atomic JSON filesystem storage.
- **Direct Browser-to-Browser Streaming (Zero Host Bandwidth):** Once PHP relays the initial WebRTC connection handshakes (Offers/Answers), high-definition screen video and lossless audio stream **Peer-to-Peer directly between browser clients via UDP**. Your InfinityFree monthly bandwidth quota is preserved!
- **Built-in Session Privacy Shield:** The `api/data/` session folder contains strict Apache `.htaccess` rules (`Deny from all`) so no unauthorized third party can browse or inspect active broadcast rooms.

---

## 🚀 How to Deploy to InfinityFree in 3 Steps

### Step 1: Open Your InfinityFree File Manager or FTP (FileZilla)
Log in to your InfinityFree control panel and launch the **Online File Manager** (or connect via FileZilla using your FTP credentials).

### Step 2: Navigate to your Domain Folder (`htdocs/`)
Open the `htdocs/` folder of your domain or subdomain (e.g. `yourname.infinityfreeapp.com/htdocs/`).

### Step 3: Drag & Drop the Contents of `php-app/`
Select **everything inside the `php-app/` folder** and upload it directly into `htdocs/`:
- `index.php`
- `.htaccess`
- `assets/` (css & js)
- `api/` (create_room, join_room, signal, poll, utils, and data folder)

**That is it! No database creation, SQL imports, or terminal installation required!**

---

## 🧪 Testing Your Live InfinityFree Broadcast
1. Open your InfinityFree website URL in Chrome or Edge (e.g. `https://yourname.infinityfreeapp.com/`).
2. Click **🎬 Launch Studio** to generate your broadcast room and receive a 6-character Room ID!
3. Inside your **Presenter Studio Deck**, click **🖥️ Share Screen & Audio** or **🎙️ Audio-Only (Radio Mode)**.
4. Share your Room ID with friends or open a second browser window and click **🎧 Join Audience** to experience instant real-time streaming!
