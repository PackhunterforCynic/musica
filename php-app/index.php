<?php
// Musica PHP & WebRTC Studio - Shared Hosting Edition
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Musica Studio – Real-Time Broadcast Portal</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

    <!-- VIEW 1: LANDING HERO PORTAL -->
    <main id="view-landing">
        <div class="hero-glow"></div>
        <section class="hero-content">
            <span class="logo-badge">📻 PHP WebRTC Streaming Engine</span>
            <h1>Real-Time Screen &amp; Audio Broadcast Studio</h1>
            <p class="subtitle">Create a room. Stream high-definition display media or lossless studio radio audio directly to any audience without additional software installations.</p>
            
            <div class="card-deck">
                <div class="glass-panel portal-card" id="btn-show-create">
                    <span style="font-size: 2rem;">🎬</span>
                    <h3>Launch Studio</h3>
                    <p>Create a secure broadcast chamber as Presenter with custom room controls and telemetry gauges.</p>
                </div>
                <div class="glass-panel portal-card" id="btn-show-join">
                    <span style="font-size: 2rem;">🎧</span>
                    <h3>Join Audience</h3>
                    <p>Enter a live broadcast room to view screen streams or tune into high-fidelity Radio Mode feeds.</p>
                </div>
            </div>
        </section>
    </main>

    <!-- MODAL: CREATE ROOM -->
    <div class="modal-overlay" id="modal-create">
        <div class="glass-panel modal-box">
            <button class="btn-close">&times;</button>
            <h2 style="margin-bottom: 1.5rem; font-size: 1.5rem; font-weight: 900;">Create Studio Room</h2>
            <form id="form-create">
                <div class="form-group">
                    <label>Your Display Name</label>
                    <input type="text" id="create-name" placeholder="Host Robinson" required autofocus>
                </div>
                <div class="form-group">
                    <label>Broadcast Room Name</label>
                    <input type="text" id="create-room-name" value="Live Production Showcase" required>
                </div>
                <div class="form-group">
                    <label>Room Password (Optional)</label>
                    <input type="password" id="create-password" placeholder="Leave empty for public studio">
                </div>
                <button type="submit" class="btn-primary">⚡ Launch Broadcast Studio</button>
            </form>
        </div>
    </div>

    <!-- MODAL: JOIN ROOM -->
    <div class="modal-overlay" id="modal-join">
        <div class="glass-panel modal-box">
            <button class="btn-close">&times;</button>
            <h2 style="margin-bottom: 1.5rem; font-size: 1.5rem; font-weight: 900;">Enter Studio Stream</h2>
            <form id="form-join">
                <div class="form-group">
                    <label>Room ID</label>
                    <input type="text" id="join-room-id" placeholder="e.g. M7R2-X8" style="text-transform: uppercase; font-family: monospace; font-weight: bold;" required autofocus>
                </div>
                <div class="form-group">
                    <label>Your Name</label>
                    <input type="text" id="join-name" placeholder="Listener Name" required>
                </div>
                <div class="form-group">
                    <label>Password (if protected)</label>
                    <input type="password" id="join-password" placeholder="Enter password if required">
                </div>
                <button type="submit" class="btn-primary">🎧 Tune Into Broadcast</button>
            </form>
        </div>
    </div>

    <!-- VIEW 2: LIVE BROADCAST STUDIO -->
    <div id="view-studio">
        <!-- Studio Header -->
        <header class="studio-header">
            <div class="header-brand">
                <span>⚡ MUSICA STUDIO</span>
                <span class="badge-room" id="display-room-id">ID: ----</span>
            </div>
            <div style="display: flex; gap: 12px; align-items: center;">
                <span id="display-user-role" style="font-weight: 900; font-size: 0.8rem; padding: 6px 12px; background: rgba(30,41,59,0.8); border-radius: 8px;">👑 HOST</span>
                <span style="font-weight: 800; font-size: 0.8rem; color: #a855f7;">👥 <span id="badge-count">1</span> Viewers</span>
                <button class="btn-dock btn-rose" id="btn-leave">Exit Studio</button>
            </div>
        </header>

        <!-- Studio Body -->
        <div class="studio-body">
            <!-- Stage Deck -->
            <section class="stage-deck">
                <div class="video-container">
                    <video id="stage-video" autoplay playsinline></video>
                    
                    <!-- Audio-Only Radio Visualizer Deck -->
                    <div class="radio-deck" id="radio-deck">
                        <div style="font-size: 3rem;">🎙️</div>
                        <h2 style="font-size: 1.8rem; font-weight: 900; margin-top: 1rem;">Radio Mode Active</h2>
                        <p style="color: #94a3b8; font-size: 0.9rem;">Broadcasting Lossless Studio Device Audio</p>
                        <div class="equalizer-box">
                            <span class="eq-bar"></span>
                            <span class="eq-bar"></span>
                            <span class="eq-bar"></span>
                            <span class="eq-bar"></span>
                            <span class="eq-bar"></span>
                        </div>
                    </div>
                </div>

                <!-- Control Docks -->
                <div class="control-dock" id="controls-host">
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-dock btn-indigo" onclick="startScreenShare(true)">🖥️ Share Screen &amp; Audio</button>
                        <button class="btn-dock btn-emerald" onclick="startRadioMode()">🎙️ Audio-Only (Radio Mode)</button>
                    </div>
                    <span style="font-size: 0.8rem; font-weight: 800; color: #10b981;">● READY TO STREAM</span>
                </div>

                <div class="control-dock" id="controls-audience" style="display: none;">
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span style="font-size: 0.85rem; font-weight: 800; color: #a855f7;">🔊 Volume</span>
                        <input type="range" min="0" max="1" step="0.05" value="0.9" style="accent-color: #9333ea;" onchange="document.getElementById('stage-video').volume = this.value">
                    </div>
                    <span style="font-size: 0.8rem; color: #10b981; font-weight: 800;">● RECEIVING LIVE STUDIO FEED</span>
                </div>
            </section>

            <!-- Roster & Chat Sidebar -->
            <aside class="studio-sidebar">
                <div class="sidebar-tabs">
                    <button class="tab-btn active">💬 Live Chat</button>
                    <button class="tab-btn">👥 Roster</button>
                </div>
                
                <div class="sidebar-content" style="display: flex; flex-direction: column; gap: 1rem;">
                    <div id="participant-list" style="border: 1px solid rgba(51,65,85,0.4); border-radius: 12px; padding: 6px; background: rgba(2,6,23,0.5);"></div>
                    <div id="chat-messages" style="flex: 1; min-height: 200px; overflow-y: auto;"></div>
                </div>

                <form class="chat-footer" id="form-chat">
                    <input type="text" id="chat-input-text" class="chat-input" placeholder="Type message..." required>
                    <button type="submit" class="btn-dock btn-indigo" style="padding: 10px 14px;">Send</button>
                </form>
            </aside>
        </div>

        <!-- Real-Time Telemetry Gauge Footer -->
        <footer class="telemetry-bar">
            <span>📡 TELEMETRY:</span>
            <span class="telemetry-item">STATUS: <strong>ONLINE</strong></span>
            <span class="telemetry-item">TRANSPORT: <strong>P2P WEBRTC (UDP)</strong></span>
            <span class="telemetry-item">SIGNALING: <strong>PHP ASYNC RELAY</strong></span>
            <span class="telemetry-item">LATENCY: <strong>16 ms</strong></span>
            <span class="telemetry-item">HOSTING: <strong>INFINITYFREE COMPLIANT</strong></span>
        </footer>
    </div>

    <script src="assets/js/app.js"></script>
</body>
</html>
