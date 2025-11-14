import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken, verifyToken } from '@/lib/auth';
import { z } from 'zod';

const settingSchema = z.object({
  key: z.string(),
  value: z.string(),
  description: z.string().optional(),
  category: z.string(),
  isPublic: z.boolean().optional(),
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

// Default settings
const defaultSettings = [
  {
    key: 'company_name',
    value: '"SimpleCRM"',
    description: 'Company name for the CRM',
    category: 'general',
    isPublic: true,
  },
  {
    key: 'company_email',
    value: '"info@simplecrm.com"',
    description: 'Company email address',
    category: 'general',
    isPublic: true,
  },
  {
    key: 'smtp_host',
    value: '""',
    description: 'SMTP server host',
    category: 'email',
    isPublic: false,
  },
  {
    key: 'smtp_port',
    value: '"587"',
    description: 'SMTP server port',
    category: 'email',
    isPublic: false,
  },
  {
    key: 'smtp_user',
    value: '""',
    description: 'SMTP username',
    category: 'email',
    isPublic: false,
  },
  {
    key: 'smtp_password',
    value: '""',
    description: 'SMTP password',
    category: 'email',
    isPublic: false,
  },
  {
    key: 'webhook_enabled',
    value: 'true',
    description: 'Enable webhook processing',
    category: 'webhook',
    isPublic: false,
  },
  {
    key: 'max_import_size',
    value: '"10485760"',
    description: 'Maximum import file size in bytes',
    category: 'import_export',
    isPublic: false,
  },
];

// Initialize default settings
async function initializeSettings() {
  const existingSettings = await db.settings.count();
  if (existingSettings === 0) {
    await db.settings.createMany({
      data: defaultSettings,
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await checkAdmin(request);
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Initialize default settings if none exist
    await initializeSettings();

    const where: any = {};
    if (category) where.category = category;
    
    // Non-admins can only see public settings
    if (!authUser) {
      where.isPublic = true;
    }

    const settings = await db.settings.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { key: 'asc' },
      ],
    });

    // Parse JSON values
    const parsedSettings = settings.reduce((acc, setting) => {
      try {
        acc[setting.key] = JSON.parse(setting.value);
      } catch {
        acc[setting.key] = setting.value;
      }
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      settings: parsedSettings,
      rawSettings: authUser ? settings : settings.filter(s => s.isPublic),
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
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
    const { key, value, description, category, isPublic } = settingSchema.parse(body);

    // Initialize default settings if none exist
    await initializeSettings();

    const setting = await db.settings.upsert({
      where: { key },
      update: {
        value: typeof value === 'string' ? value : JSON.stringify(value),
        description,
        category,
        isPublic,
      },
      create: {
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value),
        description,
        category,
        isPublic,
      },
    });

    return NextResponse.json(setting, { status: 201 });
  } catch (error) {
    console.error('Error creating setting:', error);
    return NextResponse.json(
      { error: 'Failed to create setting' },
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
    const settings = body.settings;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      );
    }

    // Initialize default settings if none exist
    await initializeSettings();

    const updatePromises = Object.entries(settings).map(([key, value]) =>
      db.settings.upsert({
        where: { key },
        update: {
          value: typeof value === 'string' ? value : JSON.stringify(value),
        },
        create: {
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value),
          category: 'general',
          isPublic: true,
        },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}