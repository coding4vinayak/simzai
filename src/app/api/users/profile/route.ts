import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken, verifyToken } from '@/lib/auth';

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

    const user = await db.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        mobile: true,
        address: true,
        bio: true,
        avatar: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone, mobile, address, bio, avatar } = body;

    const updatedUser = await db.user.update({
      where: { id: authUser.userId },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(mobile !== undefined && { mobile }),
        ...(address !== undefined && { address }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        mobile: true,
        address: true,
        bio: true,
        avatar: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}