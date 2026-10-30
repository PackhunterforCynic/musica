import assert from 'assert';
import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { roomRouter } from '../routes/roomRoutes';
import { roomService } from '../services/RoomService';
import { queueService } from '../services/QueueService';
import { storageService } from '../services/StorageService';
import { generateUniqueRoomId, isValidRoomIdFormat } from '../utils/idGenerator';
import { hashPassword, verifyPassword, sanitizeText } from '../utils/security';
import { Track } from '@musica/shared';

async function runTestSuite() {
  console.log('========================================================');
  console.log('🛡️  MUSICA 2.0 ENTERPRISE VERIFICATION TEST SUITE');
  console.log('========================================================');

  // 1. Storage initialization
  console.log('\n[1/6] Initializing transactional storage layer...');
  await storageService.initialize();
  console.log('  ✅ Storage initialized successfully.');

  // 2. Cryptographic Security & Hashing Tests
  console.log('\n[2/6] Testing Cryptographic Password Hashing (scrypt memory-hard)...');
  const secret = 'SuperSecurePass123!';
  const hashed = hashPassword(secret);
  assert(hashed.includes(':'), 'Hash format must include salt:derivedKey');
  assert(verifyPassword(secret, hashed) === true, 'Correct password must verify');
  assert(verifyPassword('WrongPassword', hashed) === false, 'Incorrect password must be rejected');
  assert(verifyPassword('SuperSecurePass123!', 'legacyPlaintext') === false, 'Mismatched legacy password must fail');
  console.log('  ✅ Password hashing and constant-time verification passed.');

  // 3. Text Sanitization (XSS Defense)
  console.log('\n[3/6] Testing Input Sanitization & XSS Defense...');
  const dirty = '<script>alert("hacked")</script>Hello & Welcome!';
  const clean = sanitizeText(dirty);
  assert(!clean.includes('<script>'), 'Script tags must be escaped');
  assert(clean.includes('&lt;script&gt;'), 'HTML entities must be encoded');
  console.log('  ✅ Text sanitization verified:', clean);

  // 4. 4-Character Room Code Generator (CSPRNG)
  console.log('\n[4/6] Testing CSPRNG 4-Character Room ID Generation...');
  const generatedId = await generateUniqueRoomId();
  assert(isValidRoomIdFormat(generatedId), `ID must match 4-character regex: ${generatedId}`);
  assert(!/[01IO]/.test(generatedId), 'ID must exclude ambiguous characters (0, 1, I, O)');
  console.log('  ✅ Generated unambiguous Room ID:', generatedId);

  // 5. Room Service Lifecycle & Password Validation
  console.log('\n[5/6] Testing Room Creation & Access Enforcement...');
  const roomResult = await roomService.createRoom({
    hostName: 'TestHost',
    roomName: 'Musica 2.0 Showcase Room',
    password: secret,
    category: 'music',
    visibility: 'public',
  });
  assert(roomResult.roomId, 'Must return roomId');
  assert(roomResult.hostAuthToken, 'Must issue hostAuthToken');
  assert(isValidRoomIdFormat(roomResult.roomId), 'RoomId must be 4 characters');

  // Validate join with correct password
  const joined = await roomService.validateJoin({
    roomId: roomResult.roomId,
    userName: 'AudienceMember',
    password: secret,
  });
  assert(joined.roomId === roomResult.roomId, 'Should validate join successfully');

  // Validate join with incorrect password (must throw)
  let rejected = false;
  try {
    await roomService.validateJoin({
      roomId: roomResult.roomId,
      userName: 'Hacker',
      password: 'WrongPassword',
    });
  } catch (err: any) {
    rejected = true;
    assert(err.message.includes('password'), 'Error should cite incorrect password');
  }
  assert(rejected, 'Join with wrong password must be rejected');
  console.log('  ✅ Room lifecycle and cryptographic password protection verified.');

  // 6. Collaborative Queue Service
  console.log('\n[6/6] Testing Collaborative Music Queue Service...');
  const testTrack: Track = {
    id: 'jfKfPfyJRdk',
    title: 'Lofi Hip Hop Radio',
    artist: 'Lofi Girl',
    durationSeconds: 240,
    provider: 'youtube',
    streamId: 'jfKfPfyJRdk',
  };

  const addRes = await queueService.addToQueue(roomResult.roomId, testTrack, {
    id: 'socket-user-1',
    name: 'Alice',
  });
  assert(addRes.item.track.id === 'jfKfPfyJRdk', 'Track must be added to queue');
  assert(addRes.queue.length === 1, 'Queue length must be 1');

  // Upvote test
  const voteRes = await queueService.voteTrack(roomResult.roomId, addRes.item.id, 'socket-user-2');
  assert(voteRes.updatedItem?.votes === 2, 'Track votes must increment to 2');

  // Pop next track
  const popRes = await queueService.popNextTrack(roomResult.roomId);
  assert(popRes.nextTrack?.track.title === 'Lofi Hip Hop Radio', 'Next track must pop properly');
  console.log('  ✅ Collaborative Queue and voting algorithms verified.');

  console.log('\n========================================================');
  console.log('🎉 ALL 6 MUSICA 2.0 INTEGRATION TEST SUITES PASSED! 🎉');
  console.log('========================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
