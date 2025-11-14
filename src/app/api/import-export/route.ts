import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken, verifyToken } from '@/lib/auth';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const createImportExportSchema = z.object({
  type: z.enum(['import', 'export']),
  fileType: z.enum(['csv', 'json', 'xlsx']),
  data: z.any().optional(), // For imports
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

// Helper function to generate CSV
function generateCSV(data: any[], headers: string[]): string {
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

// Helper function to parse CSV
function parseCSV(csvText: string): any[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    data.push(row);
  }
  
  return data;
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;

    const [imports, total] = await Promise.all([
      db.importExport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.importExport.count({ where }),
    ]);

    return NextResponse.json({
      imports,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching import/export history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch import/export history' },
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

    const formData = await request.formData();
    const type = formData.get('type') as string;
    const fileType = formData.get('fileType') as string;
    const file = formData.get('file') as File;

    if (!type || !fileType) {
      return NextResponse.json(
        { error: 'Type and fileType are required' },
        { status: 400 }
      );
    }

    const importExport = await db.importExport.create({
      data: {
        type,
        fileType,
        fileName: file?.name || `${type}-${Date.now()}.${fileType}`,
        createdBy: admin.userId,
      },
    });

    if (type === 'import' && file) {
      // Process import
      try {
        await db.importExport.update({
          where: { id: importExport.id },
          data: { status: 'processing' },
        });

        const fileContent = await file.text();
        let data: any[] = [];

        if (fileType === 'csv') {
          data = parseCSV(fileContent);
        } else if (fileType === 'json') {
          data = JSON.parse(fileContent);
        }

        let processed = 0;
        const errors: any[] = [];

        for (const row of data) {
          try {
            if (row.email && row.name) {
              await db.customer.create({
                data: {
                  name: row.name,
                  email: row.email,
                  phone: row.phone || null,
                  company: row.company || null,
                  status: row.status || 'new',
                  source: row.source || 'import',
                  tags: row.tags ? JSON.stringify(row.tags.split(',').map((t: string) => t.trim())) : null,
                },
              });
              processed++;
            } else {
              errors.push({
                row,
                error: 'Missing required fields: name and email',
              });
            }
          } catch (error) {
            errors.push({
              row,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        await db.importExport.update({
          where: { id: importExport.id },
          data: {
            status: errors.length > 0 ? 'completed' : 'completed',
            records: data.length,
            processed,
            errors: errors.length > 0 ? JSON.stringify(errors) : null,
          },
        });

        return NextResponse.json({
          message: 'Import completed',
          importExport: {
            ...importExport,
            records: data.length,
            processed,
            errors: errors.length,
          },
        });
      } catch (error) {
        await db.importExport.update({
          where: { id: importExport.id },
          data: { status: 'failed' },
        });

        throw error;
      }
    } else if (type === 'export') {
      // Process export
      try {
        await db.importExport.update({
          where: { id: importExport.id },
          data: { status: 'processing' },
        });

        const customers = await db.customer.findMany({
          include: {
            _count: {
              select: {
                interactions: true,
                tasks: true,
                invoices: true,
              },
            },
          },
        });

        let fileContent: string;
        let fileName: string;

        if (fileType === 'csv') {
          const headers = ['name', 'email', 'phone', 'company', 'status', 'source', 'tags', 'createdAt', 'interactionsCount', 'tasksCount', 'invoicesCount'];
          const csvData = customers.map(customer => ({
            ...customer,
            tags: customer.tags || '',
            interactionsCount: customer._count.interactions,
            tasksCount: customer._count.tasks,
            invoicesCount: customer._count.invoices,
          }));
          fileContent = generateCSV(csvData, headers);
          fileName = `customers-export-${Date.now()}.csv`;
        } else {
          fileContent = JSON.stringify(customers, null, 2);
          fileName = `customers-export-${Date.now()}.json`;
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'uploads');
        try {
          await mkdir(uploadsDir, { recursive: true });
        } catch (error) {
          // Directory might already exist
        }

        const filePath = join(uploadsDir, fileName);
        await writeFile(filePath, fileContent);

        await db.importExport.update({
          where: { id: importExport.id },
          data: {
            status: 'completed',
            records: customers.length,
            processed: customers.length,
            filePath,
          },
        });

        return NextResponse.json({
          message: 'Export completed',
          importExport: {
            ...importExport,
            records: customers.length,
            processed: customers.length,
            filePath,
          },
          downloadUrl: `/api/import-export/${importExport.id}/download`,
        });
      } catch (error) {
        await db.importExport.update({
          where: { id: importExport.id },
          data: { status: 'failed' },
        });

        throw error;
      }
    }

    return NextResponse.json(importExport, { status: 201 });
  } catch (error) {
    console.error('Error creating import/export job:', error);
    return NextResponse.json(
      { error: 'Failed to create import/export job' },
      { status: 500 }
    );
  }
}