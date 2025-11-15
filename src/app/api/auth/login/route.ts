import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { z } from 'zod';
import { loginRateLimiter } from '@/lib/rate-limiter';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // Rate limiting: Check IP address and email for login attempts
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                    request.headers.get('x-real-ip') ||
                    request.headers.get('x-client-ip') ||
                    request.connection?.remoteAddress ||
                    'unknown';

    // Check rate limit for this IP
    const ipLimit = loginRateLimiter.checkLoginAttempts(`ip_${clientIP}`);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many login attempts. Please try again later.',
          retryAfter: ipLimit.resetTime
        },
        { status: 429 }
      );
    }

    // Check rate limit for this email specifically
    const emailLimit = loginRateLimiter.checkLoginAttempts(`email_${email}`);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many login attempts for this account. Please try again later.',
          retryAfter: emailLimit.resetTime
        },
        { status: 429 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        isActive: true,
        lastLogin: true,
      },
    });

    if (!user || !user.isActive) {
      // Still count failed attempts even if user doesn't exist to prevent user enumeration
      const dummyHash = await bcrypt.hash('dummy', 12);
      await bcrypt.compare(password, dummyHash); // This adds delay to prevent timing attacks

      // Update rate limits after failed attempt
      loginRateLimiter.checkLoginAttempts(`ip_${clientIP}`);
      loginRateLimiter.checkLoginAttempts(`email_${email}`);

      return NextResponse.json(
        { error: 'Invalid credentials or account disabled' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Update rate limits after failed attempt
      loginRateLimiter.checkLoginAttempts(`ip_${clientIP}`);
      loginRateLimiter.checkLoginAttempts(`email_${email}`);

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if this is using default credentials that need to be changed
    if (user.email === 'admin@simplecrm.com') {
      // Check if the password hash matches the default admin password hash
      // Default password is 'admin123' which should be hashed
      const isDefaultPassword = await bcrypt.compare('admin123', user.password);
      if (isDefaultPassword) {
        // Still allow the check but count as success for rate limiter (not a failed attempt)
        return NextResponse.json(
          {
            error: 'Default password detected. Please change your password immediately.',
            requiresPasswordChange: true,
            userId: user.id
          },
          { status: 400 }
        );
      }
    }

    // Generate JWT token
    const token = sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}