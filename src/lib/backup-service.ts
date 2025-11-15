// src/lib/backup-service.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';

const execPromise = promisify(exec);

export interface BackupOptions {
  name: string;
  description?: string;
  includeSettings?: boolean;
  includeUsers?: boolean;
  includeData?: boolean;
}

export interface BackupJob {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  outputPath: string;
  error?: string;
}

export class BackupService {
  private static instance: BackupService;
  private jobs: Map<string, BackupJob> = new Map();

  private constructor() {}

  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  async createDatabaseBackup(options: BackupOptions): Promise<BackupJob> {
    const jobId = `backup_${Date.now()}_${options.name.replace(/\s+/g, '_')}`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace(/T/, '_').split('.')[0];
    
    const backupFile = `backup_${timestamp}_${options.name.replace(/\s+/g, '_')}.sql`;
    const backupPath = path.join(process.cwd(), 'backups', backupFile);
    
    const job: BackupJob = {
      id: jobId,
      name: options.name,
      description: options.description,
      status: 'pending',
      startedAt: new Date(),
      outputPath: backupPath,
    };

    this.jobs.set(jobId, job);

    // Update job status to running
    job.status = 'running';
    this.jobs.set(jobId, job);

    try {
      // Create backup directory
      await fs.mkdir(path.join(process.cwd(), 'backups'), { recursive: true });

      // Check if DATABASE_URL is for PostgreSQL
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL environment variable not set');
      }

      if (dbUrl.includes('postgresql://') || dbUrl.includes('postgres://')) {
        // PostgreSQL backup using pg_dump
        const dbConfig = this.parsePostgresUrl(dbUrl);
        const command = `pg_dump --dbname="${dbConfig.database}" --host="${dbConfig.host}" --port="${dbConfig.port}" --username="${dbConfig.user}" --no-password --clean --create --file="${backupPath}"`;
        
        // Set password environment variable for pg_dump
        const env = { ...process.env, PGPASSWORD: dbConfig.password };
        
        try {
          await execPromise(command, { env });
        } catch (error: any) {
          // Try with a slightly different command structure
          const command2 = `pg_dump --dbname=postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database} --no-password --clean --create --file="${backupPath}"`;
          await execPromise(command2);
        }
      } else {
        // For SQLite, just copy the database file
        const sqlitePath = dbUrl.replace('file:', '');
        await fs.copyFile(sqlitePath, backupPath);
      }

      job.status = 'completed';
      job.completedAt = new Date();
      this.jobs.set(jobId, job);

      return job;
    } catch (error: any) {
      job.status = 'failed';
      job.completedAt = new Date();
      job.error = error.message;
      this.jobs.set(jobId, job);
      throw error;
    }
  }

  private parsePostgresUrl(url: string): {
    host: string;
    port: string;
    database: string;
    user: string;
    password: string;
  } {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port || '5432',
      database: parsed.pathname.substring(1),
      user: parsed.username,
      password: parsed.password,
    };
  }

  async restoreDatabase(backupFilePath: string): Promise<void> {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable not set');
    }

    if (dbUrl.includes('postgresql://') || dbUrl.includes('postgres://')) {
      // PostgreSQL restore using psql
      const dbConfig = this.parsePostgresUrl(dbUrl);
      const restoreCommand = `psql --dbname="${dbConfig.database}" --host="${dbConfig.host}" --port="${dbConfig.port}" --username="${dbConfig.user}" --file="${backupFilePath}"`;
      
      const env = { ...process.env, PGPASSWORD: dbConfig.password };
      await execPromise(restoreCommand, { env });
    } else {
      // For SQLite, copy the backup file to replace the database
      const sqlitePath = dbUrl.replace('file:', '');
      await fs.copyFile(backupFilePath, sqlitePath);
    }
  }

  getJob(jobId: string): BackupJob | undefined {
    return this.jobs.get(jobId);
  }

  listJobs(): BackupJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  async listBackupFiles(): Promise<string[]> {
    try {
      const backupDir = path.join(process.cwd(), 'backups');
      const files = await fs.readdir(backupDir);
      return files.filter(file => (file.endsWith('.sql') || file.endsWith('.json')) && file.startsWith('backup_'));
    } catch (error) {
      console.error('Error reading backup directory:', error);
      return [];
    }
  }
}