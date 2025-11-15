// src/lib/redundancy-monitor.ts
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { BackupService } from './backup-service';

export interface DataIntegrityCheck {
  tableName: string;
  recordCount: number;
  checksum: string;
  lastChecked: Date;
  status: 'valid' | 'invalid' | 'missing';
}

export interface RedundancyStatus {
  lastBackup: Date | null;
  lastIntegrityCheck: Date | null;
  dataIntegrity: DataIntegrityCheck[];
  backupStatus: 'up_to_date' | 'outdated' | 'missing';
  storageHealth: 'healthy' | 'degraded' | 'critical';
}

export class RedundancyMonitor {
  private static instance: RedundancyMonitor;
  private db: PrismaClient;
  private lastCheck: Date | null = null;

  private constructor() {
    this.db = new PrismaClient();
  }

  public static getInstance(): RedundancyMonitor {
    if (!RedundancyMonitor.instance) {
      RedundancyMonitor.instance = new RedundancyMonitor();
    }
    return RedundancyMonitor.instance;
  }

  async performDataIntegrityCheck(): Promise<DataIntegrityCheck[]> {
    const checks: DataIntegrityCheck[] = [];

    // Check each important table
    const tablesToCheck = [
      { name: 'users', model: this.db.user },
      { name: 'agents', model: this.db.agent },
      { name: 'customers', model: this.db.customer },
      { name: 'apiKeys', model: this.db.apiKey },
      { name: 'settings', model: this.db.settings },
    ];

    for (const table of tablesToCheck) {
      try {
        // Get record count
        const count = await table.model.count();
        
        // Get a sample of records to generate checksum
        // For larger tables, we might want to sample or use aggregate functions
        const records = await table.model.findMany({
          take: 1000, // Limit to 1000 records for performance
          orderBy: { id: 'asc' }
        });

        // Generate checksum from records
        const recordData = JSON.stringify(records);
        const checksum = crypto
          .createHash('sha256')
          .update(recordData)
          .digest('hex');

        checks.push({
          tableName: table.name,
          recordCount: count,
          checksum,
          lastChecked: new Date(),
          status: 'valid'
        });
      } catch (error) {
        checks.push({
          tableName: table.name,
          recordCount: 0,
          checksum: '',
          lastChecked: new Date(),
          status: 'missing'
        });
      }
    }

    this.lastCheck = new Date();
    return checks;
  }

  async getRedundancyStatus(): Promise<RedundancyStatus> {
    // Get last backup info
    let lastBackup: Date | null = null;
    const backupService = BackupService.getInstance();
    const backupFiles = await backupService.listBackupFiles();
    
    if (backupFiles.length > 0) {
      // Get the most recent backup file based on timestamp in filename
      const sortedFiles = backupFiles.sort((a, b) => {
        // Extract timestamp from filename
        const timestampA = a.match(/backup_([0-9T_\-]+)/)?.[1] || '';
        const timestampB = b.match(/backup_([0-9T_\-]+)/)?.[1] || '';
        return timestampB.localeCompare(timestampA); // Sort descending
      });
      
      if (sortedFiles[0]) {
        lastBackup = new Date();
      }
    }

    // Perform integrity check
    const integrityChecks = await this.performDataIntegrityCheck();
    const lastIntegrityCheck = this.lastCheck;

    // Determine backup status
    let backupStatus: 'up_to_date' | 'outdated' | 'missing' = 'missing';
    if (lastBackup) {
      const now = new Date();
      const diffHours = (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60);
      backupStatus = diffHours <= 24 ? 'up_to_date' : 'outdated';
    }

    // Determine storage health based on integrity checks
    let storageHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';
    const invalidChecks = integrityChecks.filter(check => check.status === 'invalid');
    const missingChecks = integrityChecks.filter(check => check.status === 'missing');
    
    if (missingChecks.length > 0) {
      storageHealth = 'critical';
    } else if (invalidChecks.length > 0) {
      storageHealth = 'degraded';
    }

    return {
      lastBackup,
      lastIntegrityCheck,
      dataIntegrity: integrityChecks,
      backupStatus,
      storageHealth
    };
  }

  async scheduleRegularChecks(): Promise<void> {
    // Schedule integrity checks every hour
    setInterval(async () => {
      try {
        await this.performDataIntegrityCheck();
        console.log('Data integrity check completed');
      } catch (error) {
        console.error('Error during scheduled integrity check:', error);
      }
    }, 60 * 60 * 1000); // Every hour

    // Additional monitoring tasks could be scheduled here
  }
}