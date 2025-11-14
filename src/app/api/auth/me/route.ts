import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = getToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    // Find session with user
    const session = await db.session.findUnique({
      where: { 
        token,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            lastLogin: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session || !session.user.isActive) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: session.user,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Authentication check failed' },
      { status: 500 }
    );
  }
}