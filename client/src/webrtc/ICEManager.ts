export class ICEManager {
  private candidateQueue: Map<string, RTCIceCandidateInit[]> = new Map();
  private onIceCandidateCallback?: (targetSocketId: string, candidate: RTCIceCandidate) => void;

  public setOnIceCandidate(cb: (targetId: string, candidate: RTCIceCandidate) => void): void {
    this.onIceCandidateCallback = cb;
  }

  public attachToConnection(targetSocketId: string, pc: RTCPeerConnection): void {
    pc.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidateCallback) {
        this.onIceCandidateCallback(targetSocketId, event.candidate);
      }
    };
  }

  public async addRemoteCandidate(targetSocketId: string, pc: RTCPeerConnection, candidateInit: RTCIceCandidateInit): Promise<void> {
    try {
      if (pc.remoteDescription && pc.remoteDescription.type) {
        await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
      } else {
        // Queue candidates until remote description is ready
        if (!this.candidateQueue.has(targetSocketId)) {
          this.candidateQueue.set(targetSocketId, []);
        }
        this.candidateQueue.get(targetSocketId)!.push(candidateInit);
      }
    } catch (error) {
      console.warn(`[ICEManager] Failed to add ICE candidate for ${targetSocketId}:`, error);
    }
  }

  public async flushQueuedCandidates(targetSocketId: string, pc: RTCPeerConnection): Promise<void> {
    const queue = this.candidateQueue.get(targetSocketId) || [];
    if (queue.length > 0 && pc.remoteDescription) {
      for (const candidate of queue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[ICEManager] Error flushing candidate:', e);
        }
      }
      this.candidateQueue.delete(targetSocketId);
    }
  }

  public clearQueue(targetSocketId: string): void {
    this.candidateQueue.delete(targetSocketId);
  }

  public clearAll(): void {
    this.candidateQueue.clear();
  }
}

export const iceManager = new ICEManager();
