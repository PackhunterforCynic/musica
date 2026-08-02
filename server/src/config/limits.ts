export const limitsConfig = {
  maxRoomSize: parseInt(process.env.MAX_ROOM_SIZE || '100', 10),
  defaultRoomSize: 50,
  maxRoomNameLength: 64,
  maxUserNameLength: 32,
  maxChatLength: 500,
  roomTimeoutMs: parseInt(process.env.ROOM_TIMEOUT || '60000', 10), // Time before empty rooms are cleaned up
  hostRecoveryGracePeriodSec: parseInt(process.env.HOST_RECOVERY_GRACE_SEC || '60', 10),
  cleanupIntervalMs: parseInt(process.env.CLEANUP_INTERVAL_MS || '60000', 10),
  maxLogsStored: 2000, // Rotate logs above this threshold during cleanup
};
