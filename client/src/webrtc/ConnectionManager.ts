import { ConnectionQuality } from '@musica/shared';

export class ConnectionManager {
  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private lastBytesReceived = 0;
  private lastTimestamp = Date.now();
  private qualityCallback?: (quality: ConnectionQuality, statsSummary?: Record<string, any>) => void;

  public setOnQualityUpdate(cb: (quality: ConnectionQuality, stats?: any) => void): void {
    this.qualityCallback = cb;
  }

  public monitorConnection(peerId: string, pc: RTCPeerConnection, intervalMs = 3000): void {
    this.stopMonitoring(peerId);

    const timer = setInterval(async () => {
      if (!pc || pc.connectionState === 'closed') {
        this.stopMonitoring(peerId);
        if (this.qualityCallback) this.qualityCallback('Disconnected');
        return;
      }

      try {
        const stats = await pc.getStats();
        let rtt = 0;
        let packetsLost = 0;
        let bitrateKbps = 0;

        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            const now = Date.now();
            const timeDiffSec = (now - this.lastTimestamp) / 1000;
            const bytesReceived = report.bytesReceived || 0;
            if (timeDiffSec > 0 && bytesReceived >= this.lastBytesReceived) {
              const bits = (bytesReceived - this.lastBytesReceived) * 8;
              bitrateKbps = Math.round(bits / timeDiffSec / 1000);
            }
            this.lastBytesReceived = bytesReceived;
            this.lastTimestamp = now;
            packetsLost += report.packetsLost || 0;
          }

          if (report.type === 'remote-inbound-rtp' || report.type === 'candidate-pair') {
            if (report.currentRoundTripTime) {
              rtt = report.currentRoundTripTime * 1000; // in ms
            } else if (report.roundTripTime) {
              rtt = report.roundTripTime * 1000;
            }
          }
        });

        const quality = this.calculateQuality(pc.connectionState, rtt, packetsLost);
        if (this.qualityCallback) {
          this.qualityCallback(quality, { rtt, packetsLost, bitrateKbps, state: pc.connectionState });
        }
      } catch (e) {
        // Ignore stats reading error
      }
    }, intervalMs);

    this.intervals.set(peerId, timer);
  }

  public stopMonitoring(peerId: string): void {
    if (this.intervals.has(peerId)) {
      clearInterval(this.intervals.get(peerId)!);
      this.intervals.delete(peerId);
    }
  }

  public stopAll(): void {
    this.intervals.forEach((timer) => clearInterval(timer));
    this.intervals.clear();
  }

  private calculateQuality(state: RTCPeerConnectionState | string, rttMs: number, lostPackets: number): ConnectionQuality {
    if (state === 'failed' || state === 'closed' || state === 'disconnected') {
      return 'Disconnected';
    }
    if (state === 'connecting' || state === 'new') {
      return 'Good';
    }
    if (rttMs > 400 || lostPackets > 50) {
      return 'Poor';
    }
    if (rttMs > 180 || lostPackets > 15) {
      return 'Fair';
    }
    if (rttMs > 80 || lostPackets > 5) {
      return 'Good';
    }
    return 'Excellent';
  }
}

export const connectionManager = new ConnectionManager();
