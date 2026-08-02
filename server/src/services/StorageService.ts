import fs from 'fs/promises';
import path from 'path';
import { appConfig } from '../config/app';
import {
  RoomsFileSchema,
  ParticipantsFileSchema,
  SessionsFileSchema,
  LogsFileSchema,
  BansFileSchema,
  StatisticsFileSchema,
  SettingsFileSchema,
  DEFAULT_STATS,
  DEFAULT_SETTINGS
} from '@musica/shared';

export class StorageService {
  private dataDir: string;
  private queues: Map<string, Promise<any>> = new Map();

  constructor() {
    this.dataDir = appConfig.dataDirectory;
  }

  /**
   * Initializes data directory and ensures all JSON schemas exist on disk.
   */
  public async initialize(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });

    await this.ensureFile<RoomsFileSchema>('rooms.json', { rooms: {} });
    await this.ensureFile<ParticipantsFileSchema>('participants.json', { participants: {}, roomParticipants: {} });
    await this.ensureFile<SessionsFileSchema>('sessions.json', { activeRooms: [], recoveringRooms: {} });
    await this.ensureFile<LogsFileSchema>('logs.json', { events: [] });
    await this.ensureFile<BansFileSchema>('bans.json', { bannedUsers: [] });
    await this.ensureFile<StatisticsFileSchema>('statistics.json', { statistics: DEFAULT_STATS });
    await this.ensureFile<SettingsFileSchema>('settings.json', { settings: DEFAULT_SETTINGS });

    console.log('[StorageService] JSON storage initialized successfully.');
  }

  private async ensureFile<T>(filename: string, initialData: T): Promise<void> {
    const filePath = this.getFilePath(filename);
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, JSON.stringify(initialData, null, 2), 'utf-8');
    }
  }

  private getFilePath(filename: string): string {
    return path.join(this.dataDir, filename);
  }

  /**
   * Serializes file access via asynchronous promise chaining to guarantee zero race conditions.
   */
  private async enqueue<T>(filename: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(filename) || Promise.resolve();
    const next = previous
      .then(() => operation())
      .catch((err) => {
        throw err;
      });
    this.queues.set(
      filename,
      next.then(() => {})
    );
    return next;
  }

  /**
   * Read JSON file with automatic parsing and queue synchronization.
   */
  public async readJson<T>(filename: string): Promise<T> {
    return this.enqueue(filename, async () => {
      const filePath = this.getFilePath(filename);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content || '{}') as T;
      } catch (error) {
        console.error(`[StorageService] Error reading ${filename}:`, error);
        throw error;
      }
    });
  }

  /**
   * Write JSON data using atomic temp file replacement to prevent data corruption during hard crashes.
   */
  public async writeJson<T>(filename: string, data: T): Promise<void> {
    return this.enqueue(filename, async () => {
      const filePath = this.getFilePath(filename);
      const tmpPath = `${filePath}.${Date.now()}.tmp`;
      try {
        const serialized = JSON.stringify(data, null, 2);
        await fs.writeFile(tmpPath, serialized, 'utf-8');
        await fs.rename(tmpPath, filePath);
      } catch (error) {
        console.error(`[StorageService] Error writing ${filename}:`, error);
        try {
          await fs.unlink(tmpPath);
        } catch {
          // ignore cleanup error if file didn't exist
        }
        throw error;
      }
    });
  }

  /**
   * Atomic update helper to mutate existing JSON content cleanly.
   */
  public async updateJson<T>(filename: string, mutATOR: (data: T) => void | Promise<void>): Promise<T> {
    return this.enqueue(filename, async () => {
      const filePath = this.getFilePath(filename);
      const content = await fs.readFile(filePath, 'utf-8');
      const data: T = JSON.parse(content || '{}');
      await mutATOR(data);
      
      const tmpPath = `${filePath}.${Date.now()}.tmp`;
      await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
      await fs.rename(tmpPath, filePath);
      return data;
    });
  }
}

export const storageService = new StorageService();
