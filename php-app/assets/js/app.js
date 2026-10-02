/**
 * Musica PHP WebRTC Client Engine
 * Asynchronous HTTP Polling Signaling & P2P Stream Broadcaster
 */

let currentRoom = null;
let currentUser = null;
let isHost = false;
let peerConnections = {};
let localStream = null;
let pollTimer = null;
let lastEventTimestamp = 0;
let isAudioOnlyMode = false;

// DOM ELEMS
const viewLanding = document.getElementById('view-landing');
const viewStudio = document.getElementById('view-studio');
const modalCreate = document.getElementById('modal-create');
const modalJoin = document.getElementById('modal-join');
const videoElement = document.getElementById('stage-video');
const radioDeck = document.getElementById('radio-deck');
const chatContainer = document.getElementById('chat-messages');
const participantContainer = document.getElementById('participant-list');

// BUTTON TRIGGERS
document.getElementById('btn-show-create').addEventListener('click', () => { modalCreate.style.display = 'flex'; });
document.getElementById('btn-show-join').addEventListener('click', () => { modalJoin.style.display = 'flex'; });
document.querySelectorAll('.btn-close').forEach(btn => btn.addEventListener('click', () => {
  modalCreate.style.display = 'none';
  modalJoin.style.display = 'none';
}));

// ROOM CREATION
document.getElementById('form-create').addEventListener('submit', async (e) => {
  e.preventDefault();
  const hostName = document.getElementById('create-name').value;
  const roomName = document.getElementById('create-room-name').value;
  const password = document.getElementById('create-password').value;
  
  try {
    const res = await fetch('api/create_room.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host_name: hostName, room_name: roomName, password })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to create room');
    
    currentRoom = data.room;
    currentUser = { id: data.user_id, name: hostName, role: 'host' };
    isHost = true;
    modalCreate.style.display = 'none';
    enterStudio(data.participants);
  } catch (err) {
    alert('Error: ' + err.message);
  }
});

// ROOM JOINING
document.getElementById('form-join').addEventListener('submit', async (e) => {
  e.preventDefault();
  const userName = document.getElementById('join-name').value;
  const roomId = document.getElementById('join-room-id').value;
  const password = document.getElementById('join-password').value;
  
  try {
    const res = await fetch('api/join_room.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: roomId, user_name: userName, password })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Could not join room');
    
    if (data.status === 'waiting_room') {
      alert(`You are in the waiting room for ${data.room_name}. Please wait for host approval.`);
      return;
    }
    
    currentRoom = data.room;
    currentUser = { id: data.user_id, name: userName, role: 'audience' };
    isHost = false;
    modalJoin.style.display = 'none';
    enterStudio(data.participants);
  } catch (err) {
    alert('Error: ' + err.message);
  }
});

function enterStudio(initialParticipants = []) {
  viewLanding.style.display = 'none';
  viewStudio.style.display = 'flex';
  document.getElementById('display-room-id').innerText = currentRoom.room_id;
  document.getElementById('display-user-role').innerText = isHost ? '👑 HOST' : '👤 VIEWER';
  
  if (isHost) {
    document.getElementById('controls-host').style.display = 'flex';
    document.getElementById('controls-audience').style.display = 'none';
  } else {
    document.getElementById('controls-host').style.display = 'none';
    document.getElementById('controls-audience').style.display = 'flex';
  }
  
  renderParticipants(initialParticipants);
  startSignalingPoll();
}

function startSignalingPoll() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    if (!currentRoom) return;
    try {
      const res = await fetch(`api/poll.php?room_id=${currentRoom.room_id}&user_id=${currentUser.id}&after=${lastEventTimestamp}`);
      const data = await res.json();
      if (!data.success) return;
      
      if (data.room_closed) {
        clearInterval(pollTimer);
        alert('Host ended the broadcast studio session.');
        location.reload();
        return;
      }
      
      if (data.server_time) lastEventTimestamp = data.server_time;
      if (data.participants) renderParticipants(data.participants);
      
      if (data.events && data.events.length > 0) {
        data.events.forEach(evt => processEvent(evt));
      }
    } catch (e) {
      console.warn('Signaling sync drop, retrying next tick...', e);
    }
  }, 1200);
}

function processEvent(evt) {
  const type = evt.type;
  const payload = evt.payload || {};
  
  if (type === 'CHAT_MESSAGE') {
    appendChat(payload.sender_name, payload.message, payload.timestamp);
  } else if (type === 'PARTICIPANT_JOINED' && isHost && localStream) {
    // Host automatically connects WebRTC peer stream to new viewers!
    initiatePeerOffer(payload.participant.id);
  } else if (type === 'WEBRTC_OFFER' && !isHost) {
    handlePeerOffer(payload.sdp, payload.sender_id, payload.is_audio_only);
  } else if (type === 'WEBRTC_ANSWER' && isHost) {
    if (peerConnections[payload.sender_id]) {
      peerConnections[payload.sender_id].setRemoteDescription(new RTCSessionDescription(payload.sdp));
    }
  } else if (type === 'WEBRTC_ICE_CANDIDATE') {
    const pc = peerConnections[payload.sender_id];
    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      pc.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(() => {});
    }
  }
}

// HOST BROADCASTING METHODS
async function startScreenShare(includeAudio = true) {
  try {
    localStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 60, max: 60 } },
      audio: includeAudio
    });
    isAudioOnlyMode = false;
    videoElement.srcObject = localStream;
    videoElement.style.display = 'block';
    radioDeck.style.display = 'none';
    broadcastToAllViewers();
  } catch (err) {
    alert('Screen Share cancelled or unavailable.');
  }
}

async function startRadioMode() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      video: false
    });
    isAudioOnlyMode = true;
    videoElement.style.display = 'none';
    radioDeck.style.display = 'flex';
    broadcastToAllViewers();
  } catch (err) {
    alert('Microphone access is required for Radio Mode.');
  }
}

function broadcastToAllViewers() {
  // Trigger SDP offers to all active viewers in room
  fetch(`api/signal.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      room_id: currentRoom.room_id,
      sender_id: currentUser.id,
      type: 'STREAM_STARTED',
      payload: { audio_only: isAudioOnlyMode }
    })
  });
}

// CHAT HANDLERS
document.getElementById('form-chat').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('chat-input-text');
  const txt = input.value.trim();
  if (!txt || !currentRoom) return;
  
  appendChat(currentUser.name, txt, Date.now() / 1000, true);
  input.value = '';
  
  await fetch('api/signal.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      room_id: currentRoom.room_id,
      sender_id: currentUser.id,
      type: 'CHAT_MESSAGE',
      payload: { sender_name: currentUser.name, message: txt, timestamp: Date.now() / 1000 }
    })
  });
});

function appendChat(user, text, timestamp, isMe = false) {
  const div = document.createElement('div');
  div.style.marginBottom = '10px';
  div.innerHTML = `<strong style="color:${isMe ? '#a855f7' : '#10b981'}; font-size:12px;">${user}:</strong> <span style="font-size:13px; color:#e2e8f0;">${text}</span>`;
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function renderParticipants(list = []) {
  participantContainer.innerHTML = '';
  list.forEach(p => {
    const d = document.createElement('div');
    d.style.padding = '8px 12px';
    d.style.borderBottom = '1px solid rgba(51,65,85,0.4)';
    d.style.fontSize = '13px';
    d.style.display = 'flex';
    d.style.justifyContent = 'space-between';
    d.innerHTML = `<span>${p.name}</span> <span style="color:#a855f7; font-weight:800; font-size:10px; text-transform:uppercase;">${p.role}</span>`;
    participantContainer.appendChild(d);
  });
  document.getElementById('badge-count').innerText = list.length;
}

document.getElementById('btn-leave').addEventListener('click', async () => {
  if (currentRoom) {
    await fetch('api/signal.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: currentRoom.room_id, sender_id: currentUser.id, type: isHost ? 'END_ROOM' : 'LEAVE_ROOM' })
    });
  }
  location.reload();
});
