export interface DeviceOption {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export interface MediaCapabilities {
  supportsDisplayMedia: boolean;
  supportsUserMedia: boolean;
  supportsAudioOutputSelection: boolean;
}

class MediaService {
  public checkCapabilities(): MediaCapabilities {
    const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';
    const hasMediaDevices = isBrowser && !!navigator.mediaDevices;

    return {
      supportsDisplayMedia: hasMediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function',
      supportsUserMedia: hasMediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function',
      supportsAudioOutputSelection: isBrowser && typeof (HTMLMediaElement.prototype as any).setSinkId === 'function',
    };
  }

  public async getAvailableDevices(): Promise<{
    audioInputs: DeviceOption[];
    audioOutputs: DeviceOption[];
    videoInputs: DeviceOption[];
  }> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return { audioInputs: [], audioOutputs: [], videoInputs: [] };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs: DeviceOption[] = [];
      const audioOutputs: DeviceOption[] = [];
      const videoInputs: DeviceOption[] = [];

      devices.forEach((d, idx) => {
        const option: DeviceOption = {
          deviceId: d.deviceId || `device-${idx}`,
          label: d.label || `${d.kind.replace('input', '').replace('output', '').toUpperCase()} Device ${idx + 1}`,
          kind: d.kind,
        };

        if (d.kind === 'audioinput') audioInputs.push(option);
        else if (d.kind === 'audiooutput') audioOutputs.push(option);
        else if (d.kind === 'videoinput') videoInputs.push(option);
      });

      return { audioInputs, audioOutputs, videoInputs };
    } catch (error) {
      console.error('[MediaService] Error enumerating devices:', error);
      return { audioInputs: [], audioOutputs: [], videoInputs: [] };
    }
  }

  public async requestAudioPermissions(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch (error) {
      return false;
    }
  }

  public async requestVideoPermissions(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch (error) {
      return false;
    }
  }

  public async setAudioOutput(mediaElement: HTMLMediaElement, deviceId: string): Promise<void> {
    if ((mediaElement as any).setSinkId && deviceId && deviceId !== 'default') {
      try {
        await (mediaElement as any).setSinkId(deviceId);
      } catch (err) {
        console.warn('[MediaService] setSinkId failed:', err);
      }
    }
  }
}

export const mediaService = new MediaService();
