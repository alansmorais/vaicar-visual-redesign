import fs from 'fs';
import path from 'path';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface StorageUploadResult {
  url: string;
  storagePath: string;
  sizeBytes: number;
  mimeType: string;
}

/**
 * Validates file magic bytes. This helper recognizes images and PDFs so callers
 * can explicitly reject documents on public-profile endpoints.
 */
export function validateImageBuffer(buffer: Buffer): { valid: boolean; mimeType?: string; error?: string } {
  if (buffer.length === 0) {
    return { valid: false, error: 'O arquivo está vazio.' };
  }
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: 'O tamanho do arquivo excede o limite máximo de 10MB.' };
  }

  if (buffer.length >= 5 && buffer.toString('ascii', 0, 5) === '%PDF-') {
    return { valid: true, mimeType: 'application/pdf' };
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return { valid: true, mimeType: 'image/jpeg' };
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, mimeType: 'image/png' };
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { valid: true, mimeType: 'image/webp' };
  }

  const headerStr = buffer.toString('utf-8', 0, Math.min(buffer.length, 100)).toLowerCase();
  if (headerStr.includes('<svg') || headerStr.includes('<?xml') || headerStr.includes('<html')) {
    return { valid: false, error: 'Arquivos SVG ou vetoriais não são permitidos por segurança.' };
  }
  return { valid: false, error: 'Formato não suportado. Utilize JPG, PNG, WebP ou PDF.' };
}

/**
 * Stores only non-sensitive profile images on local disk.
 * Identity documents must use a separate private-storage implementation.
 */
export async function storeImage(
  storagePath: string,
  buffer: Buffer,
  mimeType: string
): Promise<StorageUploadResult> {
  const normalizedPath = storagePath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!/^(users|passengers|drivers)\/[A-Za-z0-9_-]+\/profile\.(jpg|png|webp)$/.test(normalizedPath)) {
    throw new Error('Invalid public profile image storage path.');
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    throw new Error('Only supported profile image MIME types may use public profile storage.');
  }
  const checked = validateImageBuffer(buffer);
  if (!checked.valid || checked.mimeType !== mimeType) {
    throw new Error('Profile image bytes do not match the validated MIME type.');
  }

  const uploadRoot = path.resolve(process.cwd(), 'public', 'uploads');
  const filePath = path.resolve(uploadRoot, normalizedPath);
  if (!filePath.startsWith(uploadRoot + path.sep)) {
    throw new Error('Invalid public profile image storage path.');
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);

  return {
    url: `/uploads/${normalizedPath}`,
    storagePath: normalizedPath,
    sizeBytes: buffer.length,
    mimeType,
  };
}

/**
 * Reads only local, validated profile images. No Firestore or in-memory fallback:
 * those stores may contain legacy files whose privacy classification is unknown.
 */
export async function getStoredFile(storagePath: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const normalizedPath = storagePath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!/^(users|passengers|drivers)\/[A-Za-z0-9_-]+\/profile\.(jpg|png|webp)$/.test(normalizedPath)) {
    return null;
  }

  const uploadRoot = path.resolve(process.cwd(), 'public', 'uploads');
  const filePath = path.resolve(uploadRoot, normalizedPath);
  if (!filePath.startsWith(uploadRoot + path.sep) || !fs.existsSync(filePath)) {
    return null;
  }

  const buffer = fs.readFileSync(filePath);
  const checked = validateImageBuffer(buffer);
  if (!checked.valid || !checked.mimeType || checked.mimeType === 'application/pdf') {
    return null;
  }

  const extensionMime: Record<string, string> = {
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  const expectedMime = extensionMime[path.extname(filePath).slice(1).toLowerCase()];
  if (!expectedMime || checked.mimeType !== expectedMime) {
    return null;
  }

  return { buffer, mimeType: checked.mimeType };
}
