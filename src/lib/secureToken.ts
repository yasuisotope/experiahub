import crypto from 'crypto';

function getSecret(): Buffer {
  const secret = process.env.ICS_TOKEN_SECRET || process.env.NEXT_PUBLIC_ICS_TOKEN_SECRET || '';
  // Derive 32-byte key from provided secret
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

export function encryptPayload(payload: Record<string, unknown>): string {
  const key = getSecret();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const json = JSON.stringify(payload);
  const enc = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64url');
}

export function decryptPayload(token: string): any | null {
  try {
    const buf = Buffer.from(token, 'base64url');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const key = getSecret();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    return JSON.parse(dec);
  } catch {
    return null;
  }
}


