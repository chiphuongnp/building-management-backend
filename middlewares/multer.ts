import multer, { FileFilterCallback } from 'multer';
import fs from 'fs';
import path from 'path';
import { NextFunction, Request, Response } from 'express';
import { MAX_IMAGE_SIZE } from '../constants/constant';
import { responseError, logger } from '../utils/index';
import { ErrorMessage, StatusCode } from '../constants/message';
import { randomUUID } from 'crypto';

const baseDir = 'uploads';
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir);
}

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = path.join(baseDir, file.fieldname);
    ensureDir(subDir);
    cb(null, subDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const generated = `${randomUUID()}_${Date.now()}${ext}`;
    cb(null, generated);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.mimetype)) {
    cb(new Error('Only JPEG, PNG, and PDF files are allowed!'));
  } else {
    cb(null, true);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
});

const processImageUrls = async (
  obj: any,
  fileMap: Record<string, Express.Multer.File>,
  folder: string,
  uploadDir: string,
): Promise<void> => {
  if (!obj || typeof obj !== 'object') return;

  const stack: { node: any; parent?: any; key?: string | number }[] = [{ node: obj }];
  const renamePromises: Promise<void>[] = [];

  while (stack.length) {
    const { node, parent, key } = stack.pop()!;
    if (Array.isArray(node)) {
      for (let i = node.length - 1; i >= 0; i--) {
        stack.push({ node: node[i], parent: node, key: i });
      }
    } else if (node && typeof node === 'object') {
      if ('image_urls' in node && Array.isArray(node.image_urls)) {
        const newUrls = await Promise.all(
          node.image_urls.map(async (imgName: string) => {
            const file = fileMap[imgName];
            if (!file) return imgName;

            const ext = path.extname(file.originalname);
            const newFileName = `${randomUUID()}_${Date.now()}${ext}`;
            const newPath = path.join(uploadDir, newFileName);

            renamePromises.push(
              fs.promises.rename(file.path, newPath).catch((err) => {
                logger.error(`Rename failed: ${file.path} → ${newPath}`, err);
              }),
            );

            return `/uploads/${folder}/${newFileName}`;
          }),
        );

        node.image_urls = newUrls;
      }

      const keys = Object.keys(node);
      for (let i = keys.length - 1; i >= 0; i--) {
        const k = keys[i];
        stack.push({ node: node[k], parent: node, key: k });
      }
    }

    if (parent !== undefined && key !== undefined) {
      parent[key] = node;
    }
  }

  await Promise.all(renamePromises);
};

export const uploadHandler = (fieldName: string, maxFiles: number, dataName: string) => {
  const handlerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const subDir = path.join(baseDir, fieldName);
      ensureDir(subDir);
      cb(null, subDir);
    },
    filename: (req, file, cb) => cb(null, file.originalname),
  });

  const upload = multer({
    storage: handlerStorage,
    fileFilter,
    limits: { fileSize: MAX_IMAGE_SIZE },
  });

  return (req: Request, res: Response, next: NextFunction) => {
    upload.array(fieldName, maxFiles)(req, res, async (err: any) => {
      if (err) {
        logger.warn(`Upload error: ${err}`);

        return responseError(res, StatusCode.IMAGE_UPLOAD_FAILED, ErrorMessage.IMAGE_UPLOAD_FAILED);
      }

      try {
        if (!req.body || !req.files) return next();

        const files = req.files as Express.Multer.File[];
        const fileMap: Record<string, Express.Multer.File> = {};
        files.forEach((f) => (fileMap[f.originalname] = f));

        const uploadDir = path.join(baseDir, fieldName);
        const parsedData = JSON.parse(req.body[dataName]);
        processImageUrls(parsedData, fileMap, fieldName, uploadDir);
        req.body[dataName] = parsedData;

        next();
      } catch (err) {
        logger.warn(`File processing error: ${err}`);

        return responseError(
          res,
          StatusCode.CANNOT_UPLOAD_IMAGES,
          ErrorMessage.CANNOT_UPLOAD_IMAGES,
        );
      }
    });
  };
};
