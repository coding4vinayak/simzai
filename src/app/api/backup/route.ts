import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken, verifyToken } from '@/lib/auth';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

const backupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

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
      try {
        const backupDir = path.join(process.cwd(), 'backups');
        const files = await fs.readdir(backupDir);
        const backups = files
          .filter(file => file.endsWith('.json') && file.startsWith('backup_'))
          .map(file => {
            const match = file.match(/backup_([0-9T]+)_(.+)\.json/);
            if (match) {
              return {
                filename: file,
                timestamp: match[1],
                name: match[2].replace(/_/g, ' '),
                path: path.join(backupDir, file)
              };
            }
            return null;
          })
          .filter(Boolean);

        return NextResponse.json({ backups });
      } catch (error) {
        return NextResponse.json(
          { error: 'No backups directory or read error' },
          { status: 404 }
        );
      }
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
      const backupPath = path.join(backupDir, `backup_${backupName.replace(/\s+/g, '_')}.json`);

      try {
        const backupData = await fs.readFile(backupPath, 'utf8');
        const response = new NextResponse(backupData);
        response.headers.set('Content-Type', 'application/json');
        response.headers.set('Content-Disposition', `attachment; filename="${path.basename(backupPath)}"`);
        return response;
      } catch (error) {
        return NextResponse.json(
          { error: 'Backup file not found' },
          { status: 404 }
        );
      }
    }

    // Default: return backup status
    return NextResponse.json({
      message: 'Backup/restore API. Use ?action=list or ?action=download&name=backup-name'
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
    const { name, description } = backupSchema.parse(body);

    // Create backup directory if it doesn't exist
    const backupDir = path.join(process.cwd(), 'backups');
    try {
      await fs.mkdir(backupDir, { recursive: true });
    } catch (error) {
      console.error('Error creating backup directory:', error);
    }

    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace(/T/, '_').split('.')[0];
    const backupFileName = `backup_${timestamp}_${name.replace(/\s+/g, '_')}.json`;

    // Get all data to backup
    const backupData = {
      timestamp: new Date().toISOString(),
      description: description || 'Manual backup',
      settings: await db.settings.findMany(),
      users: await db.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          // Don't backup passwords
        }
      }),
      agents: await db.agent.findMany(),
      customers: await db.customer.findMany(),
      interactions: await db.interaction.findMany(),
      tasks: await db.task.findMany(),
      invoices: await db.invoice.findMany(),
      apiKeys: await db.apiKey.findMany({
        // Don't backup actual key values, just metadata
        select: {
          id: true,
          userId: true,
          agentId: true,
          name: true,
          isActive: true,
          lastUsed: true,
          expiresAt: true,
          createdAt: true,
          updatedAt: true,
          permissions: true
        }
      }),
      webhooks: await db.webhook.findMany(),
      sessions: await db.session.findMany({
        select: {
          id: true,
          userId: true,
          expiresAt: true,
          createdAt: true
        }
      }),
      importExports: await db.importExport.findMany(),
    };

    // Write backup to file
    const backupPath = path.join(backupDir, backupFileName);
    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

    return NextResponse.json({
      message: 'Backup created successfully',
      filename: backupFileName,
      path: backupPath
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'Backup creation failed' },
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
    const { backupFile, restoreSettings = true, restoreUsers = true, restoreData = true } = body;

    if (!backupFile) {
      return NextResponse.json(
        { error: 'Backup file path is required' },
        { status: 400 }
      );
    }

    // Read backup file
    const backupPath = path.join(process.cwd(), 'backups', backupFile);
    let backupData;
    
    try {
      const backupContent = await fs.readFile(backupPath, 'utf8');
      backupData = JSON.parse(backupContent);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid backup file or file not found' },
        { status: 400 }
      );
    }

    // Restore data based on flags
    if (restoreSettings) {
      // Clear existing settings and restore from backup
      await db.settings.deleteMany({});
      if (backupData.settings && backupData.settings.length > 0) {
        await db.settings.createMany({
          data: backupData.settings
        });
      }
    }

    if (restoreUsers) {
      // Don't restore users to avoid overwriting existing users and passwords
      // Just provide a warning that this is skipped
      console.warn('User restoration skipped for security reasons');
    }

    if (restoreData) {
      // Clear and restore data tables (except users for security)
      if (backupData.agents) {
        await db.agent.deleteMany({});
        if (backupData.agents.length > 0) {
          await db.agent.createMany({
            data: backupData.agents
          });
        }
      }

      if (backupData.customers) {
        await db.customer.deleteMany({});
        if (backupData.customers.length > 0) {
          await db.customer.createMany({
            data: backupData.customers
          });
        }
      }

      if (backupData.interactions) {
        await db.interaction.deleteMany({});
        if (backupData.interactions.length > 0) {
          await db.interaction.createMany({
            data: backupData.interactions
          });
        }
      }

      if (backupData.tasks) {
        await db.task.deleteMany({});
        if (backupData.tasks.length > 0) {
          await db.task.createMany({
            data: backupData.tasks
          });
        }
      }

      if (backupData.invoices) {
        await db.invoice.deleteMany({});
        if (backupData.invoices.length > 0) {
          await db.invoice.createMany({
            data: backupData.invoices
          });
        }
      }

      // Skip API keys restoration for security (they contain sensitive hashed keys)
      console.warn('API keys restoration skipped for security reasons');
      
      if (backupData.webhooks) {
        await db.webhook.deleteMany({});
        if (backupData.webhooks.length > 0) {
          await db.webhook.createMany({
            data: backupData.webhooks
          });
        }
      }

      // Skip sessions (they contain active tokens)
      console.warn('Sessions restoration skipped for security reasons');

      if (backupData.importExports) {
        await db.importExport.deleteMany({});
        if (backupData.importExports.length > 0) {
          await db.importExport.createMany({
            data: backupData.importExports
          });
        }
      }
    }

    return NextResponse.json({
      message: 'Restore completed successfully (with security limitations)',
      restored: {
        settings: restoreSettings,
        users: false, // Always false due to security
        data: restoreData,
        apiKeys: false, // Always false due to security
        sessions: false // Always false due to security
      }
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    return NextResponse.json(
      { error: 'Restore operation failed' },
      { status: 500 }
    );
  }
}

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