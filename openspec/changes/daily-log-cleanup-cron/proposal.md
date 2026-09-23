# Proposal: Daily Log Cleanup Cron Job

## Why

The backend logs application events to `./logs/` using Winston. Over time, log files accumulate on disk, which can consume unnecessary storage and lead to disk space exhaustion on server environments.

Implementing an automated daily log cleanup job ensures old log files (older than a configurable retention period, e.g., 30 days) are periodically purged without requiring manual intervention.

## What Changes

- Add a new daily cron job module `schedules/logCron.ts` using `node-cron`.
- Implement a utility function to scan the `./logs/` directory and remove log files older than a specified retention period (default: 30 days).
- Register the new `startLogCleanupJob(site)` in `schedules/index.ts` so it initializes automatically on server startup.
- Add configuration for retention days in environment config if needed.

## Capabilities

### New Capabilities

- `schedules/log-cleanup`: Automated background process that periodically scans and removes old log files from local disk storage.

### Modified Capabilities

*(None - no existing spec requirements are being modified)*

## Impact

- **Affected Code**: `schedules/logCron.ts` (NEW), `schedules/index.ts` (MODIFIED).
- **Dependencies**: `node-cron`, `fs`, `path` (all native/already installed).
- **APIs/Systems**: No public HTTP API changes; purely a background maintenance schedule.
