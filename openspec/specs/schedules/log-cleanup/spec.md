# Log Cleanup Specification

## Purpose

Provides automated background maintenance for purging outdated local log files from system storage to prevent disk space exhaustion.

## Requirements

### Requirement: Daily Scanning of Local Log Files

The background schedule SHALL execute once every 24 hours at midnight to scan the `./logs/` directory for log files older than the retention threshold.

#### Scenario: Scheduled cleanup trigger

- **WHEN** the cron schedule triggers at midnight
- **THEN** the system scans `./logs/` for files with last modified timestamps older than 30 days and removes them

### Requirement: Logging of Cleanup Execution

The background cleanup task SHALL log an informative message stating the count and total size of purged log files, or log an error if file deletion fails.

#### Scenario: Successful log cleanup execution

- **WHEN** old log files are identified and deleted
- **THEN** an info-level log message is written detailing the number of cleaned files

#### Scenario: File deletion error handling

- **WHEN** a file permission or deletion error occurs during log cleanup
- **THEN** an error-level log message is recorded without crashing the background process
