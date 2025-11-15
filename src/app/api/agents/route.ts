import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // Get agents from database
    const agents = await db.agent.findMany({
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        apiKeys: {
          select: {
            id: true,
            name: true,
            isActive: true,
            createdAt: true,
            lastUsed: true
          }
        }
      }
    });
    
    const total = await db.agent.count();
    
    return NextResponse.json({
      agents,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

const createAgentSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['form', 'ai', 'analytics', 'data', 'custom']),
  description: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
  config: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, description, capabilities, config } = createAgentSchema.parse(body);
    
    // Create the agent in the database
    const agent = await db.agent.create({
      data: {
        name,
        type,
        description: description || '',
        capabilities: capabilities ? JSON.stringify(capabilities) : '[]',
        config: config ? JSON.stringify(config) : '{}',
        userId: 'default-user-id', // In a real app, this would come from the authenticated user
      },
    });
    
    return NextResponse.json({
      agent,
      message: 'Agent created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('id');
    
    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { name, type, description, capabilities, config, isActive } = body;
    
    const updatedAgent = await db.agent.update({
      where: { id: agentId },
      data: {
        name,
        type,
        description,
        capabilities: capabilities ? JSON.stringify(capabilities) : undefined,
        config: config ? JSON.stringify(config) : undefined,
        isActive,
      },
    });
    
    return NextResponse.json({
      agent: updatedAgent,
      message: 'Agent updated successfully'
    });
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('id');
    
    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }
    
    // Delete associated API keys first
    await db.apiKey.deleteMany({
      where: { userId: agentId },
    });
    
    // Then delete the agent
    await db.agent.delete({
      where: { id: agentId },
    });
    
    return NextResponse.json({
      message: 'Agent deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    );
  }
}