import { QueueItem, Track, RoomsFileSchema } from '@musica/shared';
import { storageService } from './StorageService';
import { loggerService } from './LoggerService';

export class QueueService {
  // In-memory queues keyed by roomId for ultra-low latency operations, backed by atomic JSON persistence
  private roomQueues: Map<string, QueueItem[]> = new Map();
  private currentTracks: Map<string, QueueItem | null> = new Map();

  public async getQueue(roomId: string): Promise<QueueItem[]> {
    if (this.roomQueues.has(roomId)) {
      return [...this.roomQueues.get(roomId)!];
    }

    // Load from disk if present
    const roomsData = await storageService.readJson<RoomsFileSchema>('rooms.json');
    const diskQueue = roomsData.rooms[roomId]?.djSession?.queue || [];
    this.roomQueues.set(roomId, diskQueue);
    return [...diskQueue];
  }

  public async getCurrentTrack(roomId: string): Promise<QueueItem | null> {
    if (this.currentTracks.has(roomId)) {
      return this.currentTracks.get(roomId)!;
    }

    const roomsData = await storageService.readJson<RoomsFileSchema>('rooms.json');
    const current = roomsData.rooms[roomId]?.djSession?.currentTrack || null;
    this.currentTracks.set(roomId, current);
    return current;
  }

  public async addToQueue(
    roomId: string,
    track: Track,
    addedBy: { id: string; name: string }
  ): Promise<{ item: QueueItem; queue: QueueItem[] }> {
    const queue = await this.getQueue(roomId);

    // Prevent duplicate contiguous track additions
    const duplicate = queue.find((q) => q.track.id === track.id && q.status === 'queued');
    if (duplicate) {
      // Auto-upvote instead of duplicating
      if (!duplicate.voterIds.includes(addedBy.id)) {
        duplicate.voterIds.push(addedBy.id);
        duplicate.votes += 1;
      }
      await this.persistQueue(roomId, queue);
      return { item: duplicate, queue: [...queue] };
    }

    const newItem: QueueItem = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      roomId,
      track,
      addedBy,
      addedAt: new Date().toISOString(),
      votes: 1,
      voterIds: [addedBy.id],
      status: 'queued',
    };

    queue.push(newItem);
    this.roomQueues.set(roomId, queue);

    await this.persistQueue(roomId, queue);
    await loggerService.logEvent('QUEUE_ITEM_ADDED' as any, {
      roomId,
      userId: addedBy.id,
      userName: addedBy.name,
      details: { trackTitle: track.title, trackArtist: track.artist },
    });

    return { item: newItem, queue: [...queue] };
  }

  public async voteTrack(
    roomId: string,
    itemId: string,
    voterId: string
  ): Promise<{ updatedItem: QueueItem | null; queue: QueueItem[] }> {
    const queue = await this.getQueue(roomId);
    const item = queue.find((q) => q.id === itemId);
    if (!item) return { updatedItem: null, queue };

    const voterIndex = item.voterIds.indexOf(voterId);
    if (voterIndex === -1) {
      item.voterIds.push(voterId);
      item.votes += 1;
    } else {
      // Toggle off upvote if clicked again
      item.voterIds.splice(voterIndex, 1);
      item.votes = Math.max(0, item.votes - 1);
    }

    // Sort queue by votes descending, preserving order of addition for ties
    const activeCurrent = await this.getCurrentTrack(roomId);
    const unplayed = queue.filter((q) => q.status === 'queued');
    unplayed.sort((a, b) => b.votes - a.votes);

    const reordered = activeCurrent ? [activeCurrent, ...unplayed] : unplayed;
    this.roomQueues.set(roomId, reordered);

    await this.persistQueue(roomId, reordered);
    return { updatedItem: item, queue: [...reordered] };
  }

  public async removeFromQueue(
    roomId: string,
    itemId: string
  ): Promise<{ success: boolean; queue: QueueItem[] }> {
    const queue = await this.getQueue(roomId);
    const nextQueue = queue.filter((q) => q.id !== itemId);
    this.roomQueues.set(roomId, nextQueue);

    await this.persistQueue(roomId, nextQueue);
    return { success: true, queue: [...nextQueue] };
  }

  public async popNextTrack(roomId: string): Promise<{ nextTrack: QueueItem | null; queue: QueueItem[] }> {
    const queue = await this.getQueue(roomId);
    const nextItem = queue.find((q) => q.status === 'queued') || null;

    if (nextItem) {
      nextItem.status = 'playing';
      this.currentTracks.set(roomId, nextItem);
    } else {
      this.currentTracks.set(roomId, null);
    }

    const remaining = queue.filter((q) => q.id !== nextItem?.id);
    this.roomQueues.set(roomId, remaining);

    await this.persistQueue(roomId, remaining, nextItem);
    return { nextTrack: nextItem, queue: [...remaining] };
  }

  public async reorderQueue(roomId: string, itemIds: string[]): Promise<QueueItem[]> {
    const queue = await this.getQueue(roomId);
    const itemMap = new Map(queue.map((q) => [q.id, q]));

    const reordered: QueueItem[] = [];
    for (const id of itemIds) {
      const item = itemMap.get(id);
      if (item) {
        reordered.push(item);
        itemMap.delete(id);
      }
    }
    // Append any omitted items
    itemMap.forEach((val) => reordered.push(val));

    this.roomQueues.set(roomId, reordered);
    await this.persistQueue(roomId, reordered);
    return [...reordered];
  }

  private async persistQueue(roomId: string, queue: QueueItem[], currentTrack?: QueueItem | null): Promise<void> {
    await storageService.updateJson<RoomsFileSchema>('rooms.json', (data) => {
      if (data.rooms[roomId]) {
        if (!data.rooms[roomId].djSession) {
          data.rooms[roomId].djSession = {
            activeDjId: null,
            activeDjName: null,
            queue: [],
            history: [],
            currentTrack: null,
            allowAudienceRequests: true,
          };
        }
        data.rooms[roomId].djSession!.queue = queue;
        if (currentTrack !== undefined) {
          data.rooms[roomId].djSession!.currentTrack = currentTrack;
        }
      }
    });
  }
}

export const queueService = new QueueService();
