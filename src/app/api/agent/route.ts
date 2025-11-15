import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken, validateToken } from '@/lib/auth';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

// Middleware to get authenticated user
async function getAuthUser(request: NextRequest) {
  const decoded = await validateToken(request);
  if (!decoded) return null;

  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, role: true, isActive: true },
  });

  return user?.isActive ? decoded : null;
}

// Middleware to get agent from API key
async function getAgentFromApiKey(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const apiKey = authHeader.substring(7);

  // Use the first 8 characters of the API key to efficiently look up the key
  // This assumes the lookupKey is the first 8 characters of the original API key
  const lookupKey = apiKey.substring(0, 8);

  // Find the API key using the lookup key for efficient retrieval
  const apiKeyRecord = await db.apiKey.findFirst({
    where: {
      lookupKey: lookupKey,
      isActive: true,
    },
    include: {
      agent: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          apiKeys: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        }
      }
    }
  });

  // If we found a key, verify it matches the full provided key
  if (apiKeyRecord) {
    const isValid = await bcrypt.compare(apiKey, apiKeyRecord.key);
    if (isValid && apiKeyRecord.agent) {
      // Update last used timestamp
      await db.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: { lastUsed: new Date() },
      });
      return apiKeyRecord.agent;
    }
  }

  return null;
}

function generateApiKey(): string {
  return `sk_${randomBytes(32).toString('hex')}`;
}

export async function GET(request: NextRequest) {
  try {
    const agent = await getAgentFromApiKey(request);
    if (!agent) {
      return NextResponse.json(
        { error: 'Invalid or inactive API key' },
        { status: 401 }
      );
    }

    // Update last seen
    await db.agent.update({
      where: { id: agent.id },
      data: { lastSeen: new Date() },
    });

    return NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        description: agent.description,
        capabilities: agent.capabilities ? (() => {
          try {
            return JSON.parse(agent.capabilities);
          } catch (e) {
            console.error('Error parsing agent capabilities:', e);
            return [];
          }
        })() : [],
        config: agent.config ? (() => {
          try {
            return JSON.parse(agent.config);
          } catch (e) {
            console.error('Error parsing agent config:', e);
            return {};
          }
        })() : {},
        isActive: agent.isActive,
        lastSeen: agent.lastSeen,
        createdAt: agent.createdAt,
        user: agent.user,
      },
      user: agent.user,
    });
  } catch (error) {
    console.error('Error fetching agent info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent info' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const agent = await getAgentFromApiKey(request);
    if (!agent) {
      return NextResponse.json(
        { error: 'Invalid or inactive API key' },
        { status: 401 }
      );
    }

    const { name, permissions, expiresAt } = await request.json();

    const apiKey = generateApiKey();
    const hashedApiKey = await bcrypt.hash(apiKey, 12);
    const lookupKey = apiKey.substring(0, 8);

    const newApiKey = await db.apiKey.create({
      data: {
        userId: agent.user.id,
        agentId: agent.id, // Associate the API key with the specific agent
        name: name || `Agent API Key - ${new Date().toISOString()}`,
        key: hashedApiKey, // Store hashed version
        lookupKey: lookupKey, // Store lookup key for efficient retrieval
        permissions: permissions ? JSON.stringify(permissions) : JSON.stringify(['read', 'write']),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Log API key creation
    await db.agentActivity.create({
      data: {
        agentId: agent.id,
        type: 'api_key_created',
        action: 'create_api_key',
        data: JSON.stringify({ apiKeyId: newApiKey.id, name: newApiKey.name }),
        status: 'success',
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      apiKey: {
        id: newApiKey.id,
        name: newApiKey.name,
        key: newApiKey.key,
        permissions: (() => {
          try {
            return JSON.parse(newApiKey.permissions);
          } catch (e) {
            console.error('Error parsing API key permissions:', e);
            return [];
          }
        })(),
        expiresAt: newApiKey.expiresAt,
        createdAt: newApiKey.createdAt,
      },
      message: 'API key created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}