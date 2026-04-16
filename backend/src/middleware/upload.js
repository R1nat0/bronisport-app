import multer from 'multer';
import sharp from 'sharp';
import { randomBytes } from 'node:crypto';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'https://storage.yandexcloud.net',
  region: process.env.S3_REGION || 'ru-central1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
});

const BUCKET = process.env.S3_BUCKET || 'bronisport-photos';
const S3_PUBLIC_URL = `${process.env.S3_ENDPOINT || 'https://storage.yandexcloud.net'}/${BUCKET}`;

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const uploadPhotos = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      return cb(new Error('Only JPEG/PNG/WebP images are allowed'));
    }
    cb(null, true);
  },
}).array('photos', 5);

export async function optimizeAndUpload(files) {
  const results = [];

  for (const file of files) {
    const id = randomBytes(12).toString('hex');
    const key = `photos/${Date.now()}-${id}.webp`;

    const buffer = await sharp(file.buffer)
      .resize({ width: 1920, height: 1440, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: 'image/webp',
      })
    );

    results.push({
      key,
      url: `${S3_PUBLIC_URL}/${key}`,
      size: buffer.length,
    });
  }

  return results;
}

export async function deleteFromS3(url) {
  if (!url || !url.includes(BUCKET)) return;
  const key = url.split(`/${BUCKET}/`)[1];
  if (!key) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch {
    // file may already be gone
  }
}
