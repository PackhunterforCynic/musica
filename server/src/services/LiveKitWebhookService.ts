import { WebhookReceiver } from 'livekit-server-sdk';
import { appConfig } from '../config/app';
import { loggerService } from './LoggerService';

export class LiveKitWebhookService {
  private receiver: WebhookReceiver;

  constructor() {
    this.receiver = new WebhookReceiver(appConfig.livekit.apiKey, appConfig.livekit.apiSecret);
  }

  /**
   * Validates and processes incoming LiveKit Cloud webhook events
   */
  public async handleWebhook(body: string, authHeader: string): Promise<any> {
    const event = await this.receiver.receive(body, authHeader);
    console.log(`[LiveKitWebhook] Event ${event.event} received for room ${event.room?.name}`);

    // Log relevant room lifecycle events
    if (event.event === 'participant_joined') {
      await loggerService.logEvent('USER_JOINED', {
        roomId: event.room?.name,
        userId: event.participant?.identity,
        userName: event.participant?.name,
        details: { event: event.event },
      });
    } else if (event.event === 'participant_left') {
      await loggerService.logEvent('USER_LEFT', {
        roomId: event.room?.name,
        userId: event.participant?.identity,
        userName: event.participant?.name,
        details: { event: event.event },
      });
    } else if (event.event === 'room_finished') {
      await loggerService.logEvent('ROOM_ENDED', {
        roomId: event.room?.name,
        details: { event: event.event },
      });
    }

    return event;
  }
}

export const liveKitWebhookService = new LiveKitWebhookService();
