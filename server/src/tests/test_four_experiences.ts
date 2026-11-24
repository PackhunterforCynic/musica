import assert from 'assert';
import { roomService } from '../services/RoomService';
import { liveKitService } from '../services/LiveKitService';
import { storageService } from '../services/StorageService';

async function runFourExperiencesTest() {
  console.log('=================================================================');
  console.log('🎙️ MUSICA 1.0 — 4 CORE ROOM EXPERIENCES VERIFICATION');
  console.log('=================================================================');

  await storageService.initialize();

  // Test 1: Private Room (Must be strictly capped at 2 participants)
  console.log('\n[1/4] Testing Private Room Creation & 2-Party Enforcement...');
  const privateRoom = await roomService.createRoom({
    hostName: 'AlicePrivate',
    roomName: 'Confidential 1:1 Discussion',
    roomType: 'private',
    maxParticipants: 50, // Intentional over-allocation to test enforcement
  });

  assert.strictEqual(privateRoom.room.roomType, 'private');
  assert.strictEqual(
    privateRoom.room.maxParticipants,
    2,
    `Private room must strictly constrain maxParticipants to 2, got ${privateRoom.room.maxParticipants}`
  );
  console.log(`  ✅ Private Room ${privateRoom.roomId} enforced capacity: ${privateRoom.room.maxParticipants}`);

  // Test 2: Remote Support Room (Must be strictly capped at 2 participants)
  console.log('\n[2/4] Testing Remote Support Room Creation & Capacity...');
  const supportRoom = await roomService.createRoom({
    hostName: 'TechCustomer',
    roomName: 'AnyViewer Web Support Session',
    roomType: 'remote-support',
    maxParticipants: 100,
  });

  assert.strictEqual(supportRoom.room.roomType, 'remote-support');
  assert.strictEqual(
    supportRoom.room.maxParticipants,
    2,
    `Support room must constrain maxParticipants to 2, got ${supportRoom.room.maxParticipants}`
  );
  console.log(`  ✅ Remote Support Room ${supportRoom.roomId} enforced capacity: ${supportRoom.room.maxParticipants}`);

  // Test 3: Podcast Studio Room (Multi-participant audio/video)
  console.log('\n[3/4] Testing Podcast Studio Room Creation & Token Grants...');
  const podcastRoom = await roomService.createRoom({
    hostName: 'PodcastHost',
    roomName: 'Episode 42: Real-Time Audio at Scale',
    roomType: 'podcast',
    maxParticipants: 50,
  });

  assert.strictEqual(podcastRoom.room.roomType, 'podcast');
  assert.strictEqual(podcastRoom.room.maxParticipants, 50);

  const hostTokenResponse = await liveKitService.generateToken({
    roomId: podcastRoom.roomId,
    participantIdentity: 'host_1',
    participantName: 'PodcastHost',
    role: 'host',
  });
  assert(hostTokenResponse && hostTokenResponse.token.length > 50);

  const listenerTokenResponse = await liveKitService.generateToken({
    roomId: podcastRoom.roomId,
    participantIdentity: 'listener_1',
    participantName: 'AudienceMember',
    role: 'audience',
  });
  assert(listenerTokenResponse && listenerTokenResponse.token.length > 50);
  console.log(`  ✅ Podcast Room ${podcastRoom.roomId} created with host & audience SFU token generation verified.`);

  // Test 4: Classroom Room (Instructor + Students)
  console.log('\n[4/4] Testing Interactive Classroom Room Creation...');
  const classRoom = await roomService.createRoom({
    hostName: 'ProfessorSmith',
    roomName: 'CS101: Distributed Systems',
    roomType: 'classroom',
    maxParticipants: 60,
  });

  assert.strictEqual(classRoom.room.roomType, 'classroom');
  assert.strictEqual(classRoom.room.maxParticipants, 60);
  console.log(`  ✅ Classroom Room ${classRoom.roomId} created with capacity ${classRoom.room.maxParticipants}.`);

  console.log('\n=================================================================');
  console.log('🎉 ALL 4 CORE ROOM EXPERIENCES VERIFIED SUCCESSFULLY! 🎉');
  console.log('=================================================================');
}

runFourExperiencesTest().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
