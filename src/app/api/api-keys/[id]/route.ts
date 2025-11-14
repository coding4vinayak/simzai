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

// Middleware to check access to API key
async function checkApiKeyAccess(request: NextRequest, apiKeyId: string) {
  const authUser = await getAuthUser(request);
  if (!authUser) return null;

  const apiKey = await db.apiKey.findUnique({
    where: { id: apiKeyId },
    select: { userId: true },
  });

  if (!apiKey) return null;

  // Admins can access any API key, users can only access their own
  const isAdmin = authUser.role === 'admin';
  const isOwner = apiKey.userId === authUser.userId;

  return (isAdmin || isOwner) ? authUser : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const apiKey = await db.apiKey.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    const hasAccess = await checkApiKeyAccess(request, params.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Don't expose full key in GET request
    const response = {
      ...apiKey,
      key: `${apiKey.key.substring(0, 7)}...${apiKey.key.substring(apiKey.key.length - 4)}`,
      permissions: JSON.parse(apiKey.permissions),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching API key:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API key' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hasAccess = await checkApiKeyAccess(request, params.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, permissions, isActive, expiresAt } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (permissions !== undefined) updateData.permissions = JSON.stringify(permissions);
    if (isActive !== undefined) updateData.isActive = isActive;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const apiKey = await db.apiKey.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const response = {
      ...apiKey,
      key: `${apiKey.key.substring(0, 7)}...${apiKey.key.substring(apiKey.key.length - 4)}`,
      permissions: JSON.parse(apiKey.permissions),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hasAccess = await checkApiKeyAccess(request, params.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    await db.apiKey.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'API key deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}