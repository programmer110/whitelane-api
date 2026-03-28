/**
 * Matches Laravel Sanctum HasApiTokens::generateTokenString + createToken hashing.
 */
import crypto from 'crypto';
import crc from 'crc';

const TOKENABLE_TYPE = 'App\\Models\\User';

export { TOKENABLE_TYPE };

function strRandom(length: number): string {
  let str = '';
  while (str.length < length) {
    const size = length - str.length;
    const bytesSize = Math.ceil(size / 3) * 3;
    const bytes = crypto.randomBytes(bytesSize);
    const b64 = bytes
      .toString('base64')
      .replace(/\//g, '')
      .replace(/\+/g, '')
      .replace(/=/g, '');
    str += b64.slice(0, size);
  }
  return str.slice(0, length);
}

export function generateTokenString(prefix = ''): string {
  const tokenEntropy = strRandom(40);
  const crcHex = (crc.crc32(tokenEntropy) >>> 0).toString(16).padStart(8, '0');
  return `${prefix}${tokenEntropy}${crcHex}`;
}

export function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}
