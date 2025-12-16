import * as fs from 'fs';
import * as crypto from 'crypto';

export function isProbablyBinary(buf: Buffer): boolean {
  let zeros = 0;
  const sample = buf.subarray(0, Math.min(buf.length, 8000));
  for (const b of sample) if (b === 0) zeros++;
  return zeros > 0;
}

export function sha256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export function readTextFileSafe(path: string, maxBytes = 1_500_000): { text: string; skipped: boolean; reason?: string } {
  const st = fs.statSync(path);
  if (!st.isFile()) return { text: '', skipped: true, reason: 'not_file' };
  if (st.size > maxBytes) return { text: '', skipped: true, reason: 'too_large' };

  const buf = fs.readFileSync(path);
  if (isProbablyBinary(buf)) return { text: '', skipped: true, reason: 'binary' };

  return { text: buf.toString('utf8'), skipped: false };
}
