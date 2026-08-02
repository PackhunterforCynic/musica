import { LogEvent, LogsFileSchema } from '@musica/shared';
import { storageService } from './StorageService';
import { limitsConfig } from '../config/limits';

export class LoggerService {
  public async logEvent(
    type: LogEvent['type'],
    data: {
      roomId?: string;
      userId?: string;
      userName?: string;
      details?: Record<string, any>;
    }
  ): Promise<void> {
    const event: LogEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      roomId: data.roomId,
      userId: data.userId,
      userName: data.userName,
      details: data.details,
      timestamp: new Date().toISOString(),
    };

    console.log(`[EVENT: ${type}] ${data.roomId ? `Room: ${data.roomId}` : ''} ${data.userName ? `User: ${data.userName}` : ''}`);

    try {
      await storageService.updateJson<LogsFileSchema>('logs.json', (file) => {
        file.events.unshift(event); // Put newest event first
        if (file.events.length > limitsConfig.maxLogsStored) {
          file.events = file.events.slice(0, limitsConfig.maxLogsStored);
        }
      });
    } catch (err) {
      console.error('[LoggerService] Failed to persist event log:', err);
    }
  }

  public async getRecentLogs(limit = 100): Promise<LogEvent[]> {
    const file = await storageService.readJson<LogsFileSchema>('logs.json');
    return file.events.slice(0, limit);
  }
}

export const loggerService = new LoggerService();
