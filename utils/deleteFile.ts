import fs from 'fs';
import path from 'path';

export const deleteImages = async (image_urls: string[]) => {
  if (!image_urls || !image_urls.length) return;

  for (const image_url of image_urls) {
    try {
      const imgPath = path.resolve(process.cwd(), image_url);
      await fs.promises.access(imgPath, fs.constants.F_OK);
      await fs.promises.unlink(imgPath);
    } catch {
      continue;
    }
  }
};
