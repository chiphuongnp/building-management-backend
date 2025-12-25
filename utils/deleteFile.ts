import fs from 'fs';
import path from 'path';
import { DEFAULT_AVATAR_URL } from '../constants/constant';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
export const deleteImages = async (image_urls: string[]) => {
  if (!image_urls || !image_urls.length) return;

  for (const image_url of image_urls) {
    try {
      if (image_url === DEFAULT_AVATAR_URL) continue;

      if (!image_url.startsWith('uploads/')) continue;

      const imgPath = path.resolve(process.cwd(), image_url);
      if (!imgPath.startsWith(UPLOAD_DIR)) continue;

      await fs.promises.access(imgPath, fs.constants.F_OK);
      await fs.promises.unlink(imgPath);
    } catch {
      continue;
    }
  }
};
