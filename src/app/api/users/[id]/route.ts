import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken, verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'user']).optional(),
  isActive: z.boolean().optional(),
});

// Middleware to check admin role or self access
async function checkAccess(request: NextRequest, userId: string) {
  const token = getToken(request);
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    select: { role: true, isActive: true },
  });

  // Admin can access any user, users can only access themselves
  const isAdmin = user?.role === 'admin' && user.isActive;
  const isSelf = decoded.userId === userId;

  return (isAdmin || isSelf) ? { ...decoded, isAdmin, isSelf } : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const access = await checkAccess(request, params.id);
    if (!access) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        // Only include these fields for admins
        ...(access.isAdmin && {
          _count: {
            select: {
              apiKeys: true,
              sessions: true,
            },
          },
        }),
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
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const access = await checkAccess(request, params.id);
    if (!access) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Only admins can change role and isActive
    if (!access.isAdmin && (body.role !== undefined || body.isActive !== undefined)) {
      return NextResponse.json(
        { error: 'Only admins can change role or active status' },
        { status: 403 }
      );
    }

    const updateData: any = {};
    
    if (body.name) updateData.name = body.name;
    if (body.email) updateData.email = body.email;
    if (body.password) updateData.password = await bcrypt.hash(body.password, 12);
    if (access.isAdmin) {
      if (body.role !== undefined) updateData.role = body.role;
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
    }

    // Check if email is already taken by another user
    if (updateData.email) {
      const existingUser = await db.user.findFirst({
        where: {
          email: updateData.email,
          id: { not: params.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email is already taken by another user' },
          { status: 400 }
        );
      }
    }

    const user = await db.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const access = await checkAccess(request, params.id);
    if (!access || !access.isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can delete users' },
        { status: 403 }
      );
    }

    // Don't allow users to delete themselves
    if (access.isSelf) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    await db.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}