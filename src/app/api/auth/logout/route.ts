import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = getToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    // Remove session from database
    await db.session.deleteMany({
      where: { token },
    });

    return NextResponse.json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}