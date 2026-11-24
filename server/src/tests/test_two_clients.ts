import assert from 'assert';
import http from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientIO } from '../../../client/node_modules/socket.io-client';
import { roomRouter } from '../routes/roomRoutes';
import { roomService } from '../services/RoomService';
import { storageService } from '../services/StorageService';
import { socketService } from '../socket/SocketService';
import { SOCKET_EVENTS } from '@musica/shared';

async function runTwoClientsTest() {
  console.log('====================================================');
  console.log('🧪 MUSICA: TWO CLIENTS REAL-TIME JOIN & CHAT TEST');
  console.log('====================================================');

  await storageService.initialize();

  const app = express();
  app.use(express.json());
  app.use('/api', roomRouter);
  const server = http.createServer(app);

  const io = new SocketIOServer(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });
  socketService.initialize(io);

  const PORT = 3099;
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`[Test Server] Running on http://localhost:${PORT}`);

  try {
    // 1. Create room
    const createRes = await roomService.createRoom({
      hostName: 'RobinHost',
      roomName: 'Live Studio Test',
      roomType: 'podcast',
      maxParticipants: 10,
    });
    const roomId = createRes.roomId;
    console.log(`[1] Created room ${roomId} for host RobinHost`);

    // 2. Connect Client A (Host)
    console.log('[2] Connecting Client A (Host)...');
    const clientA = ClientIO(`http://localhost:${PORT}`, {
      transports: ['websocket'],
      forceNew: true,
    });

    let clientAParticipantJoinedReceived = false;
    let clientAChatReceived: any = null;
    let clientAParticipantsListOnJoin: any[] = [];

    await new Promise<void>((resolve, reject) => {
      clientA.on('connect', () => {
        clientA.emit(SOCKET_EVENTS.JOIN_ROOM, {
          roomId,
          name: 'RobinHost',
        });
      });

      clientA.on(SOCKET_EVENTS.ROOM_JOINED_SUCCESS, (data) => {
        console.log(`  ✅ Client A joined room. Roster count: ${data.participants.length}`);
        clientAParticipantsListOnJoin = data.participants;
        assert(data.participants.length === 1, 'Client A should see only itself initially');
        assert(data.room.participants.length === 1, 'Client A room.participants should have 1 participant');
        assert(data.localParticipant.role === 'host', 'Client A should be host');
        resolve();
      });

      clientA.on(SOCKET_EVENTS.ERROR_NOTIFICATION, (err) => reject(new Error(err.message)));
      setTimeout(() => reject(new Error('Client A join timeout')), 5000);
    });

    // Setup listener on Client A for Client B joining
    let participantJoinedPromise = new Promise<any>((resolve) => {
      clientA.on(SOCKET_EVENTS.PARTICIPANT_JOINED, (data) => {
        console.log(`  🎉 Client A received PARTICIPANT_JOINED for: ${data.participant.name}`);
        clientAParticipantJoinedReceived = true;
        resolve(data);
      });
    });

    // 3. Connect Client B (Second user)
    console.log('[3] Connecting Client B (Second user "Me")...');
    const clientB = ClientIO(`http://localhost:${PORT}`, {
      transports: ['websocket'],
      forceNew: true,
    });

    let clientBParticipantsListOnJoin: any[] = [];

    await new Promise<void>((resolve, reject) => {
      clientB.on('connect', () => {
        clientB.emit(SOCKET_EVENTS.JOIN_ROOM, {
          roomId,
          name: 'Me',
        });
      });

      clientB.on(SOCKET_EVENTS.ROOM_JOINED_SUCCESS, (data) => {
        console.log(`  ✅ Client B joined room. Roster count: ${data.participants.length}`);
        clientBParticipantsListOnJoin = data.participants;
        // Verify Client B sees BOTH RobinHost and Me!
        assert(
          data.participants.length === 2,
          `Client B should see 2 participants, got ${data.participants.length}`
        );
        assert(
          data.room.participants.length === 2,
          `Client B room.participants should have 2 participants, got ${data.room.participants.length}`
        );
        assert(
          data.participants.some((p: any) => p.name === 'RobinHost'),
          'Client B roster must contain RobinHost'
        );
        assert(
          data.participants.some((p: any) => p.name === 'Me'),
          'Client B roster must contain Me'
        );
        resolve();
      });

      clientB.on(SOCKET_EVENTS.ERROR_NOTIFICATION, (err) => reject(new Error(err.message)));
      setTimeout(() => reject(new Error('Client B join timeout')), 5000);
    });

    // 4. Verify Client A got the PARTICIPANT_JOINED event
    const joinedPayload = await participantJoinedPromise;
    assert(joinedPayload.participant.name === 'Me', 'Client A should see Me joined');
    assert(clientAParticipantJoinedReceived, 'Client A must have received PARTICIPANT_JOINED');
    console.log('  ✅ Mutual participant visibility verified!');

    // 5. Test Chat: Client B sends chat to room
    console.log('[4] Testing chat messaging between Client B and Client A...');
    const chatPromise = new Promise<any>((resolve) => {
      clientA.on(SOCKET_EVENTS.CHAT_RECEIVE, (data) => {
        console.log(`  💬 Client A received chat from ${data.message.senderName}: "${data.message.text}"`);
        clientAChatReceived = data.message;
        resolve(data.message);
      });
    });

    clientB.emit(SOCKET_EVENTS.CHAT_SEND, { text: 'Hello Robin! Can you hear me?' });
    const chatMsg = await chatPromise;
    assert(chatMsg.text === 'Hello Robin! Can you hear me?', 'Chat message content must match');
    assert(chatMsg.senderName === 'Me', 'Sender must be Me');
    console.log('  ✅ Real-time chat message broadcast verified!');

    // 6. Test Reaction: Client A sends emoji to Client B
    console.log('[5] Testing emoji reaction from Client A to Client B...');
    const reactionPromise = new Promise<any>((resolve) => {
      clientB.on(SOCKET_EVENTS.REACTION_RECEIVE, (data) => {
        console.log(`  💜 Client B received reaction: ${data.reaction.emoji} from ${data.reaction.senderName}`);
        resolve(data.reaction);
      });
    });

    clientA.emit(SOCKET_EVENTS.REACTION_SEND, { emoji: '🔥' });
    const reaction = await reactionPromise;
    assert(reaction.emoji === '🔥', 'Emoji must match');
    assert(reaction.senderName === 'RobinHost', 'Sender must be RobinHost');
    console.log('  ✅ Real-time emoji reaction broadcast verified!');

    // 7. Test Leave
    console.log('[6] Testing participant departure...');
    const leavePromise = new Promise<any>((resolve) => {
      clientA.on(SOCKET_EVENTS.PARTICIPANT_LEFT, (data) => {
        console.log(`  👋 Client A received PARTICIPANT_LEFT for: ${data.name}`);
        resolve(data);
      });
    });

    clientB.disconnect();
    const leftData = await leavePromise;
    assert(leftData.name === 'Me', 'Departure name must be Me');
    console.log('  ✅ Participant departure event verified!');

    clientA.disconnect();
    console.log('\n====================================================');
    console.log('🎉 ALL TWO-CLIENT REAL-TIME INTERACTION TESTS PASSED! 🎉');
    console.log('====================================================');
  } finally {
    server.close();
  }
}

runTwoClientsTest().catch((err) => {
  console.error('\n❌ Two-client test failed:', err);
  process.exit(1);
});
