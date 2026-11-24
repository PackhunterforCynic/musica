import assert from 'assert';
import { roomService } from '../services/RoomService';
import { liveKitService } from '../services/LiveKitService';
import { storageService } from '../services/StorageService';
import { TokenVerifier } from 'livekit-server-sdk';
import { appConfig } from '../config/app';

async function runMilestoneVerification() {
  console.log('=================================================================');
  console.log('🎵 MUSICA 2.0 — LIVEKIT SFU MILESTONE 1 VERIFICATION');
  console.log('=================================================================');

  // 1. Initialize storage
  console.log('\n[1/5] Initializing storage layer...');
  await storageService.initialize();
  console.log('  ✅ Storage initialized.');

  // 2. Host creates a Musica Room
  console.log('\n[2/5] Host creating Musica room...');
  const roomName = 'Musica 2.0 Launch Party';
  const hostName = 'AlexDJ';
  const password = 'SuperMusicSecret!';

  const room = await roomService.createRoom({
    roomName,
    hostName,
    password,
    category: 'music',
    visibility: 'public',
  });

  assert(room.roomId, 'Room must have a valid roomId');
  console.log(`  ✅ Room created: ${room.roomId} ("${roomName}") by Host "${hostName}"`);

  // 3. Backend generates LiveKit tokens for Host and Audience
  console.log('\n[3/5] Generating LiveKit SFU access tokens with role-based grants...');
  const hostTokenRes = await liveKitService.generateToken({
    roomId: room.roomId,
    participantIdentity: 'socket-host-001',
    participantName: hostName,
    role: 'host',
  });

  assert(hostTokenRes.token, 'Host token must exist');
  assert(hostTokenRes.roomName === room.roomId, 'Room name must match');
  assert(hostTokenRes.serverUrl === appConfig.livekit.apiUrl, 'Server URL must match config');
  console.log(`  ✅ Host Token generated (length: ${hostTokenRes.token.length})`);

  // Verify Host JWT Claims
  const verifier = new TokenVerifier(appConfig.livekit.apiKey, appConfig.livekit.apiSecret);
  const hostClaims = await verifier.verify(hostTokenRes.token);
  assert(hostClaims.sub === 'socket-host-001', 'Host identity claim must match');
  assert(hostClaims.video?.room === room.roomId, 'Host video room grant must match');
  assert(hostClaims.video?.canPublish === true, 'Host must have canPublish: true');
  assert(hostClaims.video?.roomAdmin === true, 'Host must have roomAdmin: true');
  assert(hostClaims.video?.canSubscribe === true, 'Host must have canSubscribe: true');
  console.log('  ✅ Host JWT claims verified: canPublish=true, roomAdmin=true, canSubscribe=true');

  // Audience Member Joins
  const audienceName = 'AudienceSam';
  await roomService.validateJoin({
    roomId: room.roomId,
    userName: audienceName,
    password,
  });

  const audienceTokenRes = await liveKitService.generateToken({
    roomId: room.roomId,
    participantIdentity: 'socket-aud-002',
    participantName: audienceName,
    role: 'audience',
  });

  assert(audienceTokenRes.token, 'Audience token must exist');
  const audienceClaims = await verifier.verify(audienceTokenRes.token);
  assert(audienceClaims.sub === 'socket-aud-002', 'Audience identity claim must match');
  assert(audienceClaims.video?.room === room.roomId, 'Audience video room grant must match');
  assert(audienceClaims.video?.canPublish === false, 'Audience must have canPublish: false');
  assert(audienceClaims.video?.canSubscribe === true, 'Audience must have canSubscribe: true');
  console.log('  ✅ Audience Token verified: canPublish=false, canSubscribe=true');

  // 4. Test DJ Role Promotion Token
  console.log('\n[4/5] Testing DJ Role Promotion LiveKit grant...');
  const djTokenRes = await liveKitService.generateToken({
    roomId: room.roomId,
    participantIdentity: 'socket-dj-003',
    participantName: 'GuestDJ_Chloe',
    role: 'dj',
  });
  const djClaims = await verifier.verify(djTokenRes.token);
  assert(djClaims.video?.canPublish === true, 'DJ must have canPublish: true');
  console.log('  ✅ DJ Token verified: canPublish=true');

  // 5. Test Room State transitions & Cleanup
  console.log('\n[5/5] Testing screen broadcast state update & clean room teardown...');
  await roomService.setScreenShareState(room.roomId, 'Sharing');
  const activeRoom = await roomService.getRoom(room.roomId);
  assert(activeRoom.room.screenShareState === 'Sharing', 'Room screenShareState should be Sharing');

  await roomService.endRoom(room.roomId, 'Host ended broadcast');
  await liveKitService.deleteRoom(room.roomId);
  console.log('  ✅ LiveKit room lifecycle and deletion teardown verified.');

  console.log('\n=================================================================');
  console.log('🎉 ALL LIVEKIT 2.0 MILESTONE 1 VERIFICATION TESTS PASSED! 🎉');
  console.log('=================================================================\n');
}

runMilestoneVerification().catch((err) => {
  console.error('\n❌ Milestone Verification Failed:', err);
  process.exit(1);
});
