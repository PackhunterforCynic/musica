const socket = io();

// State
let isHost = false;
let userName = '';
let currentRoomId = '';
let localStream = null;
let isSharing = false;
let participants = [];

const STUN_SERVERS = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }]
};

const peerConnections = new Map(); // For host
let hostConnection = null; // For listener

// Elements
const homeView = document.getElementById('home-view');
const roomView = document.getElementById('room-view');
const tabJoin = document.getElementById('tab-join');
const tabCreate = document.getElementById('tab-create');
const joinForm = document.getElementById('join-form');
const createForm = document.getElementById('create-form');

// --- UI Logic ---
tabJoin.onclick = () => {
  tabJoin.classList.add('active'); tabCreate.classList.remove('active');
  joinForm.classList.add('active'); createForm.classList.remove('active');
};
tabCreate.onclick = () => {
  tabCreate.classList.add('active'); tabJoin.classList.remove('active');
  createForm.classList.add('active'); joinForm.classList.remove('active');
};

const joinError = document.getElementById('join-error');
const joinStatus = document.getElementById('join-status');
const createError = document.getElementById('create-error');

// Join Room
document.getElementById('btn-join').onclick = () => {
  const name = document.getElementById('join-name').value;
  const room = document.getElementById('join-room').value.toUpperCase();
  const pwd = document.getElementById('join-password').value;
  if(!name || !room) return joinError.innerText = "Name and Room Code required.";
  
  joinError.innerText = "";
  joinStatus.innerText = "Requesting access...";
  userName = name;
  socket.emit('room:request_join', { roomId: room, password: pwd, userName: name }, (res) => {
    if(!res.success) {
      joinStatus.innerText = "";
      joinError.innerText = res.message;
    }
  });
};

// Create Room
document.getElementById('btn-create').onclick = () => {
  const name = document.getElementById('create-name').value;
  const pwd = document.getElementById('create-password').value;
  if(!name) return createError.innerText = "Display Name required.";
  
  createError.innerText = "";
  const room = Math.random().toString(36).substring(2, 8).toUpperCase();
  userName = name;
  socket.emit('room:create', { roomId: room, password: pwd, userName: name }, (res) => {
    if(res.success) {
      isHost = true;
      currentRoomId = room;
      setupRoom(res.room);
    } else {
      createError.innerText = res.message;
    }
  });
};

// Room Events
socket.on('room:join_accepted', ({ room }) => {
  isHost = false;
  currentRoomId = room.id;
  setupRoom(room);
});

socket.on('room:join_rejected', ({ message }) => {
  joinStatus.innerText = "";
  joinError.innerText = message;
});

socket.on('room:participants_updated', (parts) => {
  participants = parts;
  updateParticipantsList();
  
  // Host handles new peer connections
  if(isHost && isSharing && localStream) {
    const activeIds = new Set(participants.map(p => p.id));
    
    // Add new
    participants.forEach(p => {
      if(p.id !== socket.id && !peerConnections.has(p.id)) {
        createPeerConnectionForParticipant(p.id, localStream);
      }
    });

    // Cleanup disconnected
    for (const id of peerConnections.keys()) {
      if(!activeIds.has(id)) {
        peerConnections.get(id).close();
        peerConnections.delete(id);
      }
    }
  }
});

socket.on('room:host_updated', (newHostId) => {
  document.getElementById('display-host-name').innerText = participants.find(p => p.id === newHostId)?.name || 'Unknown';
});

// Approval Modal for Host
socket.on('room:join_approval', (req) => {
  const modal = document.getElementById('approval-modal');
  modal.classList.remove('hidden');
  const div = document.createElement('div');
  div.className = 'approval-req';
  div.id = `req-${req.socketId}`;
  div.innerHTML = `
    <p><strong>${req.userName}</strong> wants to join.</p>
    <div class="actions">
      <button class="btn-primary acc-btn">Accept</button>
      <button class="btn-secondary rej-btn">Reject</button>
    </div>
  `;
  div.querySelector('.acc-btn').onclick = () => {
    socket.emit('room:resolve_approval', { socketId: req.socketId, approved: true, userName: req.userName, roomId: currentRoomId });
    div.remove();
    if(modal.children.length === 0) modal.classList.add('hidden');
  };
  div.querySelector('.rej-btn').onclick = () => {
    socket.emit('room:resolve_approval', { socketId: req.socketId, approved: false, userName: req.userName, roomId: currentRoomId });
    div.remove();
    if(modal.children.length === 0) modal.classList.add('hidden');
  };
  modal.appendChild(div);
});

function setupRoom(room) {
  homeView.classList.remove('active');
  roomView.classList.add('active');
  document.getElementById('display-room-code').innerText = room.id;
  document.getElementById('display-host-name').innerText = room.participants.find(p => p.id === room.hostId)?.name || 'Unknown';
  
  if(isHost) {
    document.getElementById('host-controls').style.display = 'flex';
  }
  
  participants = room.participants;
  updateParticipantsList();
}

function updateParticipantsList() {
  document.getElementById('participant-count').innerText = participants.length;
  const list = document.getElementById('participant-list');
  list.innerHTML = '';
  participants.forEach(p => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${p.name}</span>`;
    list.appendChild(li);
  });
}

document.getElementById('btn-leave').onclick = () => {
  window.location.reload();
};

// --- WebRTC Logic ---

const videoElement = document.getElementById('stream-video');
const videoPlaceholder = document.getElementById('video-placeholder');
const btnShareScreen = document.getElementById('btn-share-screen');
const btnShareMic = document.getElementById('btn-share-mic');
const btnStopShare = document.getElementById('btn-stop-share');

async function handleShare(type) {
  if (isSharing) stopSharing();
  try {
    if (type === 'screen') {
      localStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      videoElement.srcObject = localStream;
      videoElement.style.display = 'block';
      videoPlaceholder.style.display = 'none';
    } else {
      localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      videoElement.style.display = 'none';
      videoPlaceholder.innerHTML = '<p style="color: var(--accent); font-size: 1.2rem;">🎤 Streaming Audio Only...</p>';
      videoPlaceholder.style.display = 'block';
    }
    
    isSharing = true;
    videoElement.muted = true;
    
    btnShareScreen.style.display = 'none';
    btnShareMic.style.display = 'none';
    btnStopShare.style.display = 'block';

    const track = localStream.getVideoTracks()[0] || localStream.getAudioTracks()[0];
    if (track) track.onended = stopSharing;

    participants.forEach(p => {
      if(p.id !== socket.id) createPeerConnectionForParticipant(p.id, localStream);
    });
  } catch (err) { console.error(err); }
}

btnShareScreen.onclick = () => handleShare('screen');
btnShareMic.onclick = () => handleShare('mic');
btnStopShare.onclick = stopSharing;

function stopSharing() {
  if(localStream) localStream.getTracks().forEach(t => t.stop());
  localStream = null;
  isSharing = false;
  
  videoElement.style.display = 'none';
  videoElement.srcObject = null;
  videoPlaceholder.innerHTML = '<p>Waiting for stream...</p>';
  videoPlaceholder.style.display = 'block';
  
  btnShareScreen.style.display = 'block';
  btnShareMic.style.display = 'block';
  btnStopShare.style.display = 'none';
  
  peerConnections.forEach(pc => pc.close());
  peerConnections.clear();
}

async function createPeerConnectionForParticipant(targetId, stream) {
  const pc = new RTCPeerConnection(STUN_SERVERS);
  peerConnections.set(targetId, pc);

  pc.onicecandidate = e => {
    if(e.candidate) socket.emit('webrtc:ice-candidate', { targetSocketId: targetId, candidate: e.candidate });
  };
  stream.getTracks().forEach(track => pc.addTrack(track, stream));

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit('webrtc:offer', { targetSocketId: targetId, offer });
}

socket.on('webrtc:offer', async ({ offer, senderId }) => {
  if(isHost) return;
  if(hostConnection) hostConnection.close();
  hostConnection = new RTCPeerConnection(STUN_SERVERS);
  
  hostConnection.onicecandidate = e => {
    if(e.candidate) socket.emit('webrtc:ice-candidate', { targetSocketId: senderId, candidate: e.candidate });
  };
  hostConnection.ontrack = e => {
    videoElement.srcObject = e.streams[0];
    videoElement.style.display = 'block';
    videoPlaceholder.style.display = 'none';
  };
  hostConnection.onconnectionstatechange = () => {
    if(['disconnected', 'failed', 'closed'].includes(hostConnection.connectionState)) {
      videoElement.style.display = 'none';
      videoPlaceholder.style.display = 'block';
    }
  };

  await hostConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await hostConnection.createAnswer();
  await hostConnection.setLocalDescription(answer);
  socket.emit('webrtc:answer', { targetSocketId: senderId, answer });
});

socket.on('webrtc:answer', async ({ answer, senderId }) => {
  if(!isHost) return;
  const pc = peerConnections.get(senderId);
  if(pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('webrtc:ice-candidate', async ({ candidate, senderId }) => {
  const pc = isHost ? peerConnections.get(senderId) : hostConnection;
  if(pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
});

// --- Chat Logic ---
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const btnSend = document.getElementById('btn-send');
const btnEmoji = document.getElementById('btn-emoji');
const emojiPicker = document.getElementById('emoji-picker');

btnEmoji.onclick = () => emojiPicker.classList.toggle('hidden');
emojiPicker.onclick = (e) => {
  if(e.target.tagName === 'SPAN') {
    socket.emit('chat:reaction', { roomId: currentRoomId, emoji: e.target.innerText });
    emojiPicker.classList.add('hidden');
  }
};

btnSend.onclick = () => {
  if(!chatInput.value.trim()) return;
  socket.emit('chat:message', { roomId: currentRoomId, message: chatInput.value });
  chatInput.value = '';
};

socket.on('chat:message', (msg) => {
  const div = document.createElement('div');
  div.className = `msg-wrapper ${msg.senderId === socket.id ? 'self' : 'other'}`;
  div.innerHTML = `
    <span class="msg-sender">${msg.senderName}</span>
    <div class="msg">${msg.text}</div>
  `;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on('chat:reaction', (r) => {
  const div = document.createElement('div');
  div.className = `msg-wrapper other`;
  div.innerHTML = `
    <span class="msg-sender">${r.senderName}</span>
    <div class="msg-reaction">${r.emoji}</div>
  `;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});
