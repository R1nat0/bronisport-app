import multer from 'multer';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';
import { randomBytes } from 'node:crypto';

export const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const TMP_DIR = path.resolve(process.cwd(), 'uploads', '.tmp');

for (const dir of [UPLOADS_DIR, TMP_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const tmpStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TMP_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const id = randomBytes(12).toString('hex');
    cb(null, `${Date.now()}-${id}${ext}`);
  },
});

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const uploadPhotos = multer({
  storage: tmpStorage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      return cb(new Error('Only JPEG/PNG/WebP images are allowed'));
    }
    cb(null, true);
  },
}).array('photos', 5);

export async function optimizePhotos(files) {
  const results = [];
  for (const file of files) {
    const id = randomBytes(12).toString('hex');
    const outName = `${Date.now()}-${id}.webp`;
    const outPath = path.join(UPLOADS_DIR, outName);

    await sharp(file.path)
      .resize({ width: 1920, height: 1440, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(outPath);

    fs.unlinkSync(file.path);

    results.push({
      filename: outName,
      url: `/uploads/${outName}`,
      size: fs.statSync(outPath).size,
    });
  }
  return results;
}
