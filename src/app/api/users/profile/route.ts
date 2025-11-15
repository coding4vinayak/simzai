import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken, validateToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// Middleware to get authenticated user
async function getAuthUser(request: NextRequest) {
  const decoded = await validateToken(request);
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
    const { name, phone, mobile, address, bio, avatar, currentPassword, newPassword } = body;

    // If changing password, validate current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to change password' },
          { status: 400 }
        );
      }

      // Get current user to verify password
      const currentUser = await db.user.findUnique({
        where: { id: authUser.userId },
        select: { password: true }
      });

      if (!currentUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      // Validate new password strength
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: 'New password must be at least 8 characters long' },
          { status: 400 }
        );
      }

      // Hash the new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update user with new password
      const updatedUser = await db.user.update({
        where: { id: authUser.userId },
        data: {
          ...(name && { name }),
          ...(phone !== undefined && { phone }),
          ...(mobile !== undefined && { mobile }),
          ...(address !== undefined && { address }),
          ...(bio !== undefined && { bio }),
          ...(avatar !== undefined && { avatar }),
          password: hashedNewPassword,
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
    }

    // Update profile without password change
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