import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get counts for dashboard
    const [
      totalCustomers,
      newLeads,
      todayFollowups,
      pendingTasks,
      statusCounts,
      recentCustomers,
    ] = await Promise.all([
      // Total customers
      db.customer.count(),
      
      // New leads (status = 'new')
      db.customer.count({ where: { status: 'new' } }),
      
      // Today's followups
      db.interaction.count({
        where: {
          nextFollowup: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      
      // Pending tasks
      db.task.count({ where: { status: 'pending' } }),
      
      // Status breakdown
      db.customer.groupBy({
        by: ['status'],
        _count: true,
      }),
      
      // Recent customers
      db.customer.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          interactions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    // Get tasks due today
    const tasksDueToday = await db.task.findMany({
      where: {
        status: 'pending',
        runAt: {
          gte: today,
          lt: tomorrow,
        },
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
      orderBy: { runAt: 'asc' },
      take: 10,
    });

    // Get recent interactions
    const recentInteractions = await db.interaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      stats: {
        totalCustomers,
        newLeads,
        todayFollowups,
        pendingTasks,
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
      tasksDueToday,
      recentCustomers,
      recentInteractions,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}