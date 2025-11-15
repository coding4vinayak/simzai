import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken, verifyToken } from '@/lib/auth';
import { z } from 'zod';
import { BackupService } from '@/lib/backup-service';
import fs from 'fs';
import path from 'path';

const backupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  includeSettings: z.boolean().optional().default(true),
  includeUsers: z.boolean().optional().default(true),
  includeData: z.boolean().optional().default(true),
});

// Middleware to check admin role
async function checkAdmin(request: NextRequest) {
  const token = getToken(request);
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    select: { role: true, isActive: true },
  });

  return user?.role === 'admin' && user.isActive ? decoded : null;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'list') {
      // List all backup files
      const backupService = BackupService.getInstance();
      const files = await backupService.listBackupFiles();

      return NextResponse.json({ 
        backupFiles: files,
        backupDirectory: path.join(process.cwd(), 'backups')
      });
    } else if (action === 'jobs') {
      // List all backup jobs
      const backupService = BackupService.getInstance();
      const jobs = backupService.listJobs();

      return NextResponse.json({ jobs });
    } else if (action === 'download') {
      // Download a specific backup
      const backupName = searchParams.get('name');
      if (!backupName) {
        return NextResponse.json(
          { error: 'Backup name is required' },
          { status: 400 }
        );
      }

      const backupDir = path.join(process.cwd(), 'backups');
      const backupPath = path.join(backupDir, backupName);

      if (!fs.existsSync(backupPath)) {
        return NextResponse.json(
          { error: 'Backup file not found' },
          { status: 404 }
        );
      }

      // Check if the file name is valid (security check)
      const normalizedPath = path.resolve(backupPath);
      const backupDirPath = path.resolve(backupDir);
      
      if (!normalizedPath.startsWith(backupDirPath)) {
        return NextResponse.json(
          { error: 'Invalid backup file path' },
          { status: 400 }
        );
      }

      const fileContent = await fs.promises.readFile(backupPath);
      const response = new NextResponse(fileContent);
      response.headers.set('Content-Type', 'application/octet-stream');
      response.headers.set('Content-Disposition', `attachment; filename="${path.basename(backupPath)}"`);
      return response;
    }

    // Return backup service status
    const backupService = BackupService.getInstance();
    const jobs = backupService.listJobs();
    
    return NextResponse.json({
      message: 'Backup service API',
      activeJobs: jobs.filter(job => job.status === 'running').length,
      recentJobs: jobs.slice(0, 10)
    });
  } catch (error) {
    console.error('Error in backup GET:', error);
    return NextResponse.json(
      { error: 'Backup operation failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, includeSettings, includeUsers, includeData } = backupSchema.parse(body);

    // Create backup using the service
    const backupService = BackupService.getInstance();
    const job = await backupService.createDatabaseBackup({
      name,
      description,
      includeSettings,
      includeUsers,
      includeData,
    });

    return NextResponse.json({
      message: 'Backup initiated successfully',
      jobId: job.id,
      status: job.status
    }, { status: 202 }); // 202 Accepted since it might take time
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'Backup creation failed: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { backupFile } = body;

    if (!backupFile) {
      return NextResponse.json(
        { error: 'Backup file is required' },
        { status: 400 }
      );
    }

    // Security check - ensure the file is in the backups directory
    const backupDir = path.join(process.cwd(), 'backups');
    const backupPath = path.join(backupDir, backupFile);
    const normalizedPath = path.resolve(backupPath);
    const backupDirPath = path.resolve(backupDir);
    
    if (!normalizedPath.startsWith(backupDirPath) || !fs.existsSync(backupPath)) {
      return NextResponse.json(
        { error: 'Invalid backup file' },
        { status: 400 }
      );
    }

    // Restore using the service
    const backupService = BackupService.getInstance();
    await backupService.restoreDatabase(backupPath);

    return NextResponse.json({
      message: 'Restore completed successfully'
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    return NextResponse.json(
      { error: 'Restore operation failed: ' + (error as Error).message },
      { status: 500 }
    );
  }
}