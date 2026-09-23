# Tasks

## 1. Implementation

- [ ] 1.1 Create `schedules/logCron.ts` with `startLogCleanupJob(site)` using `node-cron` scheduled at `0 0 * * *` to delete `./logs/` files older than 30 days and verify file scanning logic with unit/integration tests or manual execution.
- [ ] 1.2 Export and register `startLogCleanupJob(site)` in `schedules/index.ts` within `initSchedules()` and verify startup initialization.

## 2. Verification

- [ ] 2.1 Run tests (`npm test`) and code formatting (`npm run format:check`) to ensure clean compilation and compliance with repository standards.
