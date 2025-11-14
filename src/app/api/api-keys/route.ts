import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken, verifyToken } from '@/lib/auth';
import { z } from 'zod';
import { randomBytes } from 'crypto';

const createApiKeySchema = z.object({
  name: z.string().min(1),
  permissions: z.array(z.string()),
  expiresAt: z.string().optional(),
});

// Middleware to get authenticated user
async function getAuthUser(request: NextRequest) {
  const token = getToken(request);
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, role: true, isActive: true },
  });

  return user?.isActive ? decoded : null;
}

function generateApiKey(): string {
  return `sk_${randomBytes(32).toString('hex')}`;
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = { userId: authUser.userId };
    
    // Admins can see all API keys
    if (authUser.role === 'admin') {
      delete where.userId;
    }

    const [apiKeys, total] = await Promise.all([
      db.apiKey.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.apiKey.count({ where }),
    ]);

    // Don't expose full keys in list view
    const maskedKeys = apiKeys.map(key => ({
      ...key,
      key: `${key.key.substring(0, 7)}...${key.key.substring(key.key.length - 4)}`,
      permissions: JSON.parse(key.permissions),
    }));

    return NextResponse.json({
      apiKeys: maskedKeys,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, permissions, expiresAt } = createApiKeySchema.parse(body);

    const key = generateApiKey();

    const apiKey = await db.apiKey.create({
      data: {
        userId: authUser.userId,
        name,
        key,
        permissions: JSON.stringify(permissions),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Return full key only on creation
    const response = {
      ...apiKey,
      permissions: JSON.parse(apiKey.permissions),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}