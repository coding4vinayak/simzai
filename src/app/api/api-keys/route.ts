import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sign } from 'jsonwebtoken';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getToken, validateToken } from '@/lib/auth';

// Schema for creating API keys
const createApiKeySchema = z.object({
  name: z.string().min(1).max(255),
  permissions: z.array(z.string()).optional().default(['read', 'write']),
  expiresAt: z.string().datetime().optional(),
});

// Helper function to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  const decoded = await validateToken(request);
  if (!decoded) return null;

  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, role: true, isActive: true },
  });

  return user?.isActive ? decoded : null;
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get API keys for the authenticated user only
    const apiKeys = await db.apiKey.findMany({
      where: {
        userId: authUser.userId,
      },
      select: {
        id: true,
        name: true,
        key: false, // Never return the actual API key (now hashed anyway)
        isActive: true,
        createdAt: true,
        lastUsed: true,
        expiresAt: true,
        permissions: true
      }
    });
    
    // For security, don't return the actual API keys, only metadata
    const safeApiKeys = apiKeys.map(({ key, ...rest }) => ({
      ...rest,
      maskedKey: key ? key.substring(0, 4) + '...' + key.substring(key.length - 4) : ''
    }));
    
    return NextResponse.json({
      apiKeys: safeApiKeys
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
    const body = await request.json();
    const { name, permissions, expiresAt } = createApiKeySchema.parse(body);
    
    // Generate a secure API key
    const apiKey = `crm_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;

    // Hash the API key before storing it
    const hashedApiKey = await bcrypt.hash(apiKey, 12);

    // Create a deterministic lookup key (first 8 characters of the API key for efficient lookup)
    // This makes it possible to find the API key efficiently without checking all keys
    const lookupKey = apiKey.substring(0, 8);

    const newApiKey = await db.apiKey.create({
      data: {
        name,
        key: hashedApiKey, // Store hashed version
        lookupKey: lookupKey, // Store lookup key for efficient retrieval
        permissions: permissions ? JSON.stringify(permissions) : '["read", "write"]',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        userId: 'default-user-id', // In a real app, this comes from authentication
        isActive: true,
      }
    });

    // Return the API key to the user (this should only happen once)
    return NextResponse.json({
      apiKey: {
        id: newApiKey.id,
        name: newApiKey.name,
        key: apiKey, // Return plain text to user only on creation
        permissions: (() => {
          try {
            return JSON.parse(newApiKey.permissions);
          } catch (e) {
            console.error('Error parsing API key permissions:', e);
            return [];
          }
        })(),
        isActive: newApiKey.isActive,
        createdAt: newApiKey.createdAt,
        expiresAt: newApiKey.expiresAt,
      },
      message: 'API key created successfully. Store this key securely as it will not be shown again.'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}

// Update an API key
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');
    
    if (!keyId) {
      return NextResponse.json(
        { error: 'API Key ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { name, isActive } = body;
    
    const updatedKey = await db.apiKey.update({
      where: { id: keyId },
      data: {
        name,
        isActive,
        lastUsed: new Date(), // Update last used when modified
      }
    });
    
    return NextResponse.json({
      apiKey: updatedKey,
      message: 'API key updated successfully'
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    );
  }
}

// Delete an API key
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');
    
    if (!keyId) {
      return NextResponse.json(
        { error: 'API Key ID is required' },
        { status: 400 }
      );
    }
    
    await db.apiKey.delete({
      where: { id: keyId },
    });
    
    return NextResponse.json({
      message: 'API key deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}