# Design: Daily Log Cleanup Cron Job

## Context

The backend uses Winston for logging to `./logs/` and `node-cron` for scheduling background jobs in `schedules/`. See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**

- Implement a scheduled background job `startLogCleanupJob()` using `node-cron`.
- Scan `./logs/` directory daily and delete files older than 30 days (2,592,000,000 ms).
- Follow existing project conventions by registering the new cron schedule in `schedules/index.ts`.

**Non-Goals:**

- External log rotation to Cloud Storage or S3 (local file cleanup only).
- Compressing/archiving log files into zip/tar (direct deletion of old log files).

## Decisions

### Decision 1: Use `node-cron` schedule `0 0 * * *` (Midnight)

- **Rationale**: Midnight is low-traffic hours for the building management ecosystem.
- **Alternatives**: Running hourly (unnecessary overhead for log retention measured in days).

### Decision 2: Utility function with `fs.promises.readdir` and `fs.promises.stat`

- **Rationale**: Non-blocking async file operations. Calculate file age based on `mtimeMs` (last modified time).
- **Alternatives**: Synchronous `fs.readdirSync` (would block Express event loop).

### Decision 3: Register in `schedules/index.ts`

- **Rationale**: Keeps all background schedules centralized and initialized at startup via `initSchedules(site)`.

## Risks / Trade-offs

- **[Risk]** Log directory `./logs/` might not exist on a fresh installation.
  - **Mitigation**: Check if directory exists (`fs.existsSync`) before scanning; exit gracefully if not found.
- **[Risk]** Active log file currently being written to by Winston.
  - **Mitigation**: Only delete files older than 30 days. Active log files will have recent modification timestamps.
