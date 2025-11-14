import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken, verifyToken } from '@/lib/auth';
import { z } from 'zod';

const createAgentSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['form', 'ai', 'analytics', 'data', 'custom']),
  description: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
  config: z.string().optional(),
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

    const [agents, total] = await Promise.all([
      db.agent.findMany({
        where: { userId: authUser.userId },
        include: {
          apiKeys: {
            where: { isActive: true },
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              apiKeys: true,
              activities: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.agent.count({ where: { userId: authUser.userId } }),
    ]);

    return NextResponse.json({
      agents: agents.map(agent => ({
        ...agent,
        capabilities: agent.capabilities ? JSON.parse(agent.capabilities) : [],
        config: agent.config ? JSON.parse(agent.config) : {},
      })),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
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
    const validatedData = createAgentSchema.parse(body);

    // Create agent
    const agent = await db.agent.create({
      data: {
        userId: authUser.userId,
        ...validatedData,
        capabilities: validatedData.capabilities ? JSON.stringify(validatedData.capabilities) : null,
        config: validatedData.config ? JSON.stringify(validatedData.config) : null,
      },
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}