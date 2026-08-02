export interface BrowserInfo {
  name: 'Chrome' | 'Edge' | 'Firefox' | 'Safari' | 'Other';
  isSupported: boolean;
  warnings: string[];
}

export function getBrowserCompatibility(): BrowserInfo {
  if (typeof window === 'undefined' || !navigator || !navigator.userAgent) {
    return { name: 'Other', isSupported: false, warnings: ['Unable to detect environment.'] };
  }

  const ua = navigator.userAgent;
  const warnings: string[] = [];
  let name: BrowserInfo['name'] = 'Other';

  if (/edg/i.test(ua)) {
    name = 'Edge';
  } else if (/chrome|crios/i.test(ua) && !/edge|edg/i.test(ua)) {
    name = 'Chrome';
  } else if (/firefox|fxios/i.test(ua)) {
    name = 'Firefox';
  } else if (/safari/i.test(ua) && !/chrome|crios|edge|edg/i.test(ua)) {
    name = 'Safari';
  }

  // Check WebRTC APIs
  const hasRTC = typeof window !== 'undefined' && 'RTCPeerConnection' in window;
  if (!hasRTC) {
    warnings.push('Your browser does not support standard WebRTC Peer Connections.');
  }

  // Check display media
  const hasDisplayMedia = typeof navigator !== 'undefined' && !!navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function';
  if (!hasDisplayMedia) {
    warnings.push('Screen sharing (getDisplayMedia) is not supported in this browser version.');
  }

  if (name === 'Safari') {
    warnings.push('Safari has stricter limits on capturing system audio during screen shares. Consider Chrome or Edge for full system audio sharing.');
  }

  const isSupported = hasRTC && (hasDisplayMedia || name === 'Safari'); // Safari audience is supported even if share lacks some audio options
  return { name, isSupported, warnings };
}
