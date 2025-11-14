import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check if any users exist
    const userCount = await db.user.count();
    
    // Check if admin user exists
    const adminUser = await db.user.findFirst({
      where: { role: 'admin' }
    });

    return NextResponse.json({
      userCount,
      hasUsers: userCount > 0,
      hasAdminUser: adminUser !== null,
      adminUser: adminUser ? {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        isActive: adminUser.isActive,
        createdAt: adminUser.createdAt,
      } : null,
    });
  } catch (error) {
    console.error('Error checking database state:', error);
    return NextResponse.json(
      { error: 'Failed to check database state' },
      { status: 500 }
    );
  }
}