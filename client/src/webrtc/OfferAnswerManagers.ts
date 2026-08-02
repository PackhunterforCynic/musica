export class OfferManager {
  public async createOffer(pc: RTCPeerConnection): Promise<RTCSessionDescriptionInit> {
    const offer = await pc.createOffer({
      offerToReceiveAudio: false, // Host sends stream, does not receive broadcast media back in MVP
      offerToReceiveVideo: false,
    });
    await pc.setLocalDescription(offer);
    return offer;
  }
}

export class AnswerManager {
  public async createAnswer(pc: RTCPeerConnection, remoteOffer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await pc.setRemoteDescription(new RTCSessionDescription(remoteOffer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }
}

export const offerManager = new OfferManager();
export const answerManager = new AnswerManager();
