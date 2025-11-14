import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentName = searchParams.get('agentName');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (agentName) {
      where.agentName = { contains: agentName, mode: 'insensitive' };
    }
    
    if (status) {
      where.status = status;
    }

    const [logs, total] = await Promise.all([
      db.agentLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.agentLog.count({ where }),
    ]);

    // Parse payload JSON
    const logsWithParsedPayload = logs.map(log => ({
      ...log,
      payload: log.payload ? JSON.parse(log.payload) : null,
    }));

    return NextResponse.json({
      logs: logsWithParsedPayload,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching agent logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentName, action, payload, status } = body;

    if (!agentName || !action || !status) {
      return NextResponse.json(
        { error: 'Agent name, action, and status are required' },
        { status: 400 }
      );
    }

    const log = await db.agentLog.create({
      data: {
        agentName,
        action,
        payload: payload ? JSON.stringify(payload) : null,
        status,
      },
    });

    // Parse payload for response
    const logWithParsedPayload = {
      ...log,
      payload: log.payload ? JSON.parse(log.payload) : null,
    };

    return NextResponse.json(logWithParsedPayload, { status: 201 });
  } catch (error) {
    console.error('Error creating agent log:', error);
    return NextResponse.json(
      { error: 'Failed to create agent log' },
      { status: 500 }
    );
  }
}