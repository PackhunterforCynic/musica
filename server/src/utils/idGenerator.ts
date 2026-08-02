import { RoomsFileSchema } from '@musica/shared';
import { storageService } from '../services/StorageService';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing characters I, O, 0, 1

function generateRandomString(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * CHARS.length);
    result += CHARS[randomIndex];
  }
  return result;
}

/**
 * Generates an 8-character uppercase alphanumeric Room ID with a hyphen after 4 characters: XXXX-XXXX (e.g., ABX9-72KD).
 * Includes automatic collision checks against active rooms.json.
 */
export async function generateUniqueRoomId(): Promise<string> {
  const roomsData = await storageService.readJson<RoomsFileSchema>('rooms.json');
  const maxAttempts = 10;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const part1 = generateRandomString(4);
    const part2 = generateRandomString(4);
    const candidateId = `${part1}-${part2}`;
    
    if (!roomsData.rooms[candidateId]) {
      return candidateId;
    }
  }
  
  // Fallback if extremely high collision occurs
  return `${generateRandomString(4)}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
}

/**
 * Validates formatting of a Room ID (case-insensitive conversion to XXXX-XXXX).
 */
export function formatRoomId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (cleaned.length <= 4) {
    return cleaned;
  }
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`;
}

export function isValidRoomIdFormat(id: string): boolean {
  return /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(id);
}
