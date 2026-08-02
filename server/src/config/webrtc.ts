export const webrtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  sfuUpgradeRecommendationLimit: 20, // Recommends SFU migration if audience > 20
  defaultAudioCodec: 'opus',
  defaultVideoCodec: 'VP8',
  maxBitrateKbps: 3000,
};
