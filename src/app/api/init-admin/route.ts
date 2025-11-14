import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Check if any users already exist
    const existingUsers = await db.user.count();
    
    if (existingUsers > 0) {
      return NextResponse.json(
        { error: 'Admin user already exists' },
        { status: 400 }
      );
    }

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = await db.user.create({
      data: {
        name: 'Default Admin',
        email: 'admin@simplecrm.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: 'Default admin user created successfully',
      user: adminUser,
      credentials: {
        email: 'admin@simplecrm.com',
        password: 'admin123'
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating default admin:', error);
    return NextResponse.json(
      { error: 'Failed to create default admin user' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userCount = await db.user.count();
    
    return NextResponse.json({
      hasUsers: userCount > 0,
      userCount,
    });
  } catch (error) {
    console.error('Error checking users:', error);
    return NextResponse.json(
      { error: 'Failed to check users' },
      { status: 500 }
    );
  }
}