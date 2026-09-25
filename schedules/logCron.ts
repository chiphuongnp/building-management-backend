import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/index';
import { CronSchedule, Sites } from '../constants/enum';

export const runLogCleanup = async (
  logDir: string = './logs',
  retentionDays: number = 30,
): Promise<number> => {
  logger.info(`[LogCron] Starting log cleanup scan in directory: ${logDir}...`);

  if (!fs.existsSync(logDir)) {
    logger.info(`[LogCron] Log directory "${logDir}" does not exist. Skipping cleanup.`);
    return 0;
  }

  let cleanedCount = 0;
  try {
    const files = await fs.promises.readdir(logDir);
    const now = Date.now();
    const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;

    await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(logDir, file);
        try {
          const stats = await fs.promises.stat(filePath);
          if (stats.isFile()) {
            const ageMs = now - stats.mtimeMs;
            if (ageMs > maxAgeMs) {
              await fs.promises.unlink(filePath);
              cleanedCount++;
              logger.info(`[LogCron] Deleted old log file: ${file}`);
            }
          }
        } catch (fileErr) {
          logger.error(`[LogCron] Failed to process file ${file}:`, fileErr);
        }
      }),
    );

    logger.info(`[LogCron] Log cleanup completed. Total ${cleanedCount} log file(s) removed.`);
  } catch (err) {
    logger.error('[LogCron] Error reading log directory:', err);
  }

  return cleanedCount;
};

export const startLogCleanupJob = (site?: Sites) => {
  logger.info(`[LogCron] Scheduling log cleanup job with schedule: ${CronSchedule.LOG_CLEANUP}`);
  cron.schedule(CronSchedule.LOG_CLEANUP, () => {
    logger.info('[LogCron] Running scheduled daily log cleanup task...');
    runLogCleanup().catch((err) => logger.error('[LogCron] Error running log cleanup task:', err));
  });
};
