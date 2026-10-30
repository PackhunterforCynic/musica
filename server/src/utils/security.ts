import crypto from 'crypto';

/**
 * Derives a secure cryptographic password hash using Node.js built-in scrypt (memory-hard).
 * Format: salt:derivedKeyHex
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Constant-time password verification against stored scrypt hash.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  // Backward compatibility: if not in salt:hash format, check direct equality
  if (!storedHash.includes(':')) {
    return password === storedHash;
  }

  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;

  const keyBuffer = Buffer.from(keyHex, 'hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);

  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

/**
 * Sanitizes chat and text input against HTML/script injection.
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}
