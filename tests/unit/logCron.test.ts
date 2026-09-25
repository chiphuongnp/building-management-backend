import fs from 'fs';
import path from 'path';
import { runLogCleanup, startLogCleanupJob } from '../../schedules/logCron';

describe('logCron', () => {
  const testLogDir = path.join(__dirname, 'temp_test_logs');

  beforeEach(async () => {
    if (!fs.existsSync(testLogDir)) {
      await fs.promises.mkdir(testLogDir, { recursive: true });
    }
  });

  afterEach(async () => {
    if (fs.existsSync(testLogDir)) {
      await fs.promises.rm(testLogDir, { recursive: true, force: true });
    }
  });

  it('should return 0 if log directory does not exist', async () => {
    const nonExistentDir = path.join(__dirname, 'non_existent_dir_123');
    const result = await runLogCleanup(nonExistentDir, 30);
    expect(result).toBe(0);
  });

  it('should delete log files older than retention threshold', async () => {
    const oldFilePath = path.join(testLogDir, 'old.log');
    const newFilePath = path.join(testLogDir, 'new.log');

    await fs.promises.writeFile(oldFilePath, 'old log content');
    await fs.promises.writeFile(newFilePath, 'new log content');

    // Set old file modified time to 31 days ago
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    await fs.promises.utimes(oldFilePath, thirtyOneDaysAgo, thirtyOneDaysAgo);

    const deletedCount = await runLogCleanup(testLogDir, 30);

    expect(deletedCount).toBe(1);
    expect(fs.existsSync(oldFilePath)).toBe(false);
    expect(fs.existsSync(newFilePath)).toBe(true);
  });

  it('should start log cleanup job without throwing error', () => {
    expect(() => startLogCleanupJob()).not.toThrow();
  });
});
