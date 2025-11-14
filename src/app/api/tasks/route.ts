import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const pending = searchParams.get('pending');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (pending === 'true') {
      where.status = 'pending';
      where.runAt = { lte: new Date() };
    }

    const [tasks, total] = await Promise.all([
      db.task.findMany({
        where,
        orderBy: { runAt: 'asc' },
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      db.task.count({ where }),
    ]);

    return NextResponse.json({
      tasks,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, type, status, runAt } = body;

    if (!customerId || !type || !runAt) {
      return NextResponse.json(
        { error: 'Customer ID, type, and runAt are required' },
        { status: 400 }
      );
    }

    const task = await db.task.create({
      data: {
        customerId,
        type,
        status: status || 'pending',
        runAt: new Date(runAt),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}