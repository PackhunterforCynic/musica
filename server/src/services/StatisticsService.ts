import { StatisticsFileSchema, SystemStatistics } from '@musica/shared';
import { storageService } from './StorageService';

export class StatisticsService {
  public async getStats(): Promise<SystemStatistics> {
    const data = await storageService.readJson<StatisticsFileSchema>('statistics.json');
    return data.statistics;
  }

  public async incrementRoomsCreated(): Promise<void> {
    await storageService.updateJson<StatisticsFileSchema>('statistics.json', (data) => {
      data.statistics.totalRoomsCreated += 1;
      data.statistics.lastUpdated = new Date().toISOString();
    });
  }

  public async updateActiveRoomsCount(activeCount: number): Promise<void> {
    await storageService.updateJson<StatisticsFileSchema>('statistics.json', (data) => {
      data.statistics.activeRoomsCount = activeCount;
      if (activeCount > data.statistics.peakActiveRooms) {
        data.statistics.peakActiveRooms = activeCount;
      }
      data.statistics.lastUpdated = new Date().toISOString();
    });
  }

  public async incrementParticipantsJoined(): Promise<void> {
    await storageService.updateJson<StatisticsFileSchema>('statistics.json', (data) => {
      data.statistics.totalParticipantsJoined += 1;
      data.statistics.lastUpdated = new Date().toISOString();
    });
  }

  public async addBroadcastMinutes(minutes: number): Promise<void> {
    await storageService.updateJson<StatisticsFileSchema>('statistics.json', (data) => {
      data.statistics.totalBroadcastMinutes += Math.round(minutes * 10) / 10;
      data.statistics.lastUpdated = new Date().toISOString();
    });
  }
}

export const statisticsService = new StatisticsService();
