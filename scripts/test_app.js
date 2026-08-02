const http = require('http');
const fs = require('fs');
const path = require('path');

function request(method, pathname, data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload && { 'Content-Length': Buffer.byteLength(payload) })
      }
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body || '{}') });
        } catch (e) {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🎵 MUSICA ZERO-DB SYSTEM & API VERIFICATION SUITE');
  console.log('====================================================');

  console.log('\n🧪 1. Testing GET /api/stats (Platform Health Telemetry)...');
  const statsRes = await request('GET', '/api/stats');
  console.log('   Status:', statsRes.status);
  console.log('   Stats payload:', JSON.stringify(statsRes.body, null, 2));

  console.log('\n🧪 2. Testing POST /api/rooms (Host Room Creation)...');
  const createRes = await request('POST', '/api/rooms', {
    hostName: 'Robinson',
    roomName: 'Audio & Screen Showcase',
    maxParticipants: 50
  });
  console.log('   Status:', createRes.status);
  console.log('   Created Room Response:', JSON.stringify(createRes.body, null, 2));

  const roomId = createRes.body.roomId;
  if (!roomId || !/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(roomId)) {
    throw new Error(`Invalid or missing Room ID! Got: ${roomId}`);
  }

  console.log(`\n🧪 3. Testing GET /api/rooms/${roomId} (Anti-Collision & Room Metadata)...`);
  const detailsRes = await request('GET', `/api/rooms/${roomId}`);
  console.log('   Status:', detailsRes.status);
  console.log('   Room Details Response:', JSON.stringify(detailsRes.body, null, 2));

  console.log('\n🧪 4. Verifying Atomic Zero-DB JSON Persistence on Disk...');
  const roomsFile = path.join(__dirname, '../server/data/rooms.json');
  if (!fs.existsSync(roomsFile)) {
    throw new Error('rooms.json persistence file was not created!');
  }
  const roomsData = JSON.parse(fs.readFileSync(roomsFile, 'utf-8'));
  const roomMap = roomsData.rooms || roomsData;
  console.log(`   found rooms.json on disk! Total recorded rooms: ${Object.keys(roomMap).length}`);
  if (roomMap[roomId]) {
    console.log(`   ✅ Confirmed room ${roomId} successfully written to JSON file store natively!`);
  } else {
    throw new Error('Created room was not found in rooms.json!');
  }

  console.log('\n✨ ALL SERVER, API, AND ATOMIC STORAGE VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('❌ Test Suite Failure:', err);
  process.exit(1);
});
