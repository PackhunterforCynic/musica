const fs = require('fs');
const path = require('path');

const LOGS_FILE = path.join(__dirname, '../server/data/logs.json');
const STATS_FILE = path.join(__dirname, '../server/data/stats.json');
const ROOMS_FILE = path.join(__dirname, '../server/data/rooms.json');
const SESSIONS_FILE = path.join(__dirname, '../server/data/sessions.json');

console.log('⚡ Musica System Utility: JSON Persistence Cleanup');

function cleanFile(filePath, defaultContent) {
  if (fs.existsSync(filePath)) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2), 'utf-8');
      console.log(`✅ Successfully cleaned and reset: ${path.basename(filePath)}`);
    } catch (e) {
      console.error(`❌ Failed to reset ${path.basename(filePath)}:`, e);
    }
  } else {
    console.log(`ℹ️ File not found, skipping: ${path.basename(filePath)}`);
  }
}

// Clean event logs and dead sessions
cleanFile(LOGS_FILE, []);
cleanFile(SESSIONS_FILE, { activeRooms: [], socketToParticipant: {}, recoveringRooms: {} });

console.log('✨ Cleanup finished! Storage is fresh and ready for next broadcast session.');
