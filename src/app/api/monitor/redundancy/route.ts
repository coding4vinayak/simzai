import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken, verifyToken } from '@/lib/auth';
import { RedundancyMonitor } from '@/lib/redundancy-monitor';

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

export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const monitor = RedundancyMonitor.getInstance();
    const status = await monitor.getRedundancyStatus();

    return NextResponse.json({
      ...status,
      message: 'Redundancy monitoring status',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting redundancy status:', error);
    return NextResponse.json(
      { error: 'Redundancy status check failed' },
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

    const monitor = RedundancyMonitor.getInstance();
    const integrityChecks = await monitor.performDataIntegrityCheck();

    return NextResponse.json({
      message: 'Data integrity check completed',
      checks: integrityChecks,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error performing integrity check:', error);
    return NextResponse.json(
      { error: 'Integrity check failed' },
      { status: 500 }
    );
  }
}

// Optionally start scheduled checks when this module is first imported
// In a real system, this might be handled differently 
if (process.env.NODE_ENV !== 'test') {
  const monitor = RedundancyMonitor.getInstance();
  // Don't start scheduled checks in API route context as it would run for every request
  // Instead, this would be started in the application initialization
}