// src/lib/backup-scheduler.ts
import { BackupService, BackupOptions } from './backup-service';

export interface ScheduleConfig {
  enabled: boolean;
  interval: 'hourly' | 'daily' | 'weekly' | 'monthly';
  time?: string; // For daily/weekly/monthly backups (HH:MM format)
  retentionDays: number; // How many days of backups to keep
  includeSettings: boolean;
  includeUsers: boolean;
  includeData: boolean;
}

export class BackupScheduler {
  private static instance: BackupScheduler;
  private schedulerInterval: NodeJS.Timeout | null = null;
  private config: ScheduleConfig;
  private backupService: BackupService;

  private constructor() {
    this.backupService = BackupService.getInstance();
    // Default configuration
    this.config = {
      enabled: false,
      interval: 'daily',
      retentionDays: 7,
      includeSettings: true,
      includeUsers: true,
      includeData: true,
    };
  }

  public static getInstance(): BackupScheduler {
    if (!BackupScheduler.instance) {
      BackupScheduler.instance = new BackupScheduler();
    }
    return BackupScheduler.instance;
  }

  configure(config: Partial<ScheduleConfig>): void {
    this.config = { ...this.config, ...config };
  }

  start(): void {
    if (!this.config.enabled) {
      console.log('Backup scheduler is disabled');
      return;
    }

    if (this.schedulerInterval) {
      this.stop(); // Stop any existing scheduler
    }

    // Calculate milliseconds based on interval
    let intervalMs: number;
    switch (this.config.interval) {
      case 'hourly':
        intervalMs = 60 * 60 * 1000;
        break;
      case 'daily':
        intervalMs = 24 * 60 * 60 * 1000;
        break;
      case 'weekly':
        intervalMs = 7 * 24 * 60 * 60 * 1000;
        break;
      case 'monthly':
        intervalMs = 30 * 24 * 60 * 60 * 1000; // Approximate
        break;
      default:
        intervalMs = 24 * 60 * 60 * 1000; // Default to daily
    }

    console.log(`Starting backup scheduler with ${this.config.interval} interval (${intervalMs}ms)`);

    // Run initial backup
    this.createScheduledBackup();

    // Set up recurring backups
    this.schedulerInterval = setInterval(() => {
      this.createScheduledBackup();
    }, intervalMs);

    // Also run cleanup based on retention policy
    setInterval(() => {
      this.cleanupOldBackups();
    }, 24 * 60 * 60 * 1000); // Run cleanup daily
  }

  stop(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
      console.log('Backup scheduler stopped');
    }
  }

  private async createScheduledBackup(): Promise<void> {
    try {
      const options: BackupOptions = {
        name: `scheduled_${this.config.interval}`,
        description: `Automated ${this.config.interval} backup`,
        includeSettings: this.config.includeSettings,
        includeUsers: this.config.includeUsers,
        includeData: this.config.includeData,
      };

      await this.backupService.createDatabaseBackup(options);
      console.log(`Scheduled backup completed: ${new Date().toISOString()}`);
    } catch (error) {
      console.error('Error creating scheduled backup:', error);
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const backupService = this.backupService;
      const files = await backupService.listBackupFiles();

      // Filter files that are older than retention period
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      for (const file of files) {
        // Extract date from filename (assuming format: backup_YYYY-MM-DDTHH-MM-SS_name.sql)
        const dateMatch = file.match(/backup_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
        if (dateMatch) {
          const fileDate = new Date(dateMatch[1].replace(/-/g, '/').replace(/T/, ' ').replace(/-/g, ':'));
          if (fileDate < cutoffDate) {
            // TODO: Implement file deletion
            console.log(`Would delete old backup file: ${file} (older than ${this.config.retentionDays} days)`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
    }
  }

  getStatus(): { enabled: boolean; nextBackup: Date | null; config: ScheduleConfig } {
    return {
      enabled: !!this.schedulerInterval,
      nextBackup: this.schedulerInterval ? new Date(Date.now() + 
        (this.config.interval === 'hourly' ? 60 * 60 * 1000 :
         this.config.interval === 'daily' ? 24 * 60 * 60 * 1000 :
         this.config.interval === 'weekly' ? 7 * 24 * 60 * 60 * 1000 :
         30 * 24 * 60 * 60 * 1000)) : null,
      config: this.config,
    };
  }
}