import crypto from 'crypto';
import { RoomsFileSchema } from '@musica/shared';
import { storageService } from '../services/StorageService';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing characters I, O, 0, 1

/**
 * Generates a cryptographically secure random string using CSPRNG.
 */
function generateRandomString(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, CHARS.length);
    result += CHARS[randomIndex];
  }
  return result;
}

/**
 * Generates a cryptographically secure random host authentication token (hex).
 */
export function generateHostAuthToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Generates an 4-character uppercase alphanumeric Room ID.
 * Includes automatic collision checks against active rooms.json.
 */
export async function generateUniqueRoomId(): Promise<string> {
  const roomsData = await storageService.readJson<RoomsFileSchema>('rooms.json');
  const maxAttempts = 10;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidateId = generateRandomString(4);
    
    if (!roomsData.rooms[candidateId]) {
      return candidateId;
    }
  }
  
  // Fallback if extremely high collision occurs
  return generateRandomString(4);
}

/**
 * Validates formatting of a Room ID (case-insensitive conversion to XXXX).
 */
export function formatRoomId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return cleaned.slice(0, 4);
}

export function isValidRoomIdFormat(id: string): boolean {
  return /^[A-Z0-9]{4}$/.test(id);
}
