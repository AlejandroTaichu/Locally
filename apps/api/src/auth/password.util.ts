import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const SALT_BYTES = 16;
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;

  const hashBuffer = Buffer.from(hash, 'hex');
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  if (hashBuffer.length !== derivedKey.length) return false;

  return timingSafeEqual(hashBuffer, derivedKey);
}
