// src/lib/csrf.ts
import { sign, verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';

const CSRF_SECRET = process.env.CSRF_SECRET || 'fallback-csrf-secret';

// Generate a CSRF token
export function generateCSRFToken(userId: string): string {
  return sign(
    { userId, type: 'csrf', timestamp: Date.now() },
    CSRF_SECRET,
    { expiresIn: '1h' } // 1 hour expiry
  );
}

// Verify a CSRF token
export function verifyCSRFToken(token: string, userId: string): boolean {
  try {
    const decoded: any = verify(token, CSRF_SECRET);
    return decoded.userId === userId && decoded.type === 'csrf';
  } catch (error) {
    return false;
  }
}

// Get CSRF token from request headers or cookies
export function getCSRFTokenFromRequest(): string | null {
  // In API routes we can't use cookies() directly, so we'll expect it in header
  // This is just a utility - in practice, Next.js API routes get headers differently
  return null;
}

// Alternative implementation for API routes - expect CSRF token in header
export function getCSRFTokenFromHeaders(headers: Headers): string | null {
  return headers.get('X-CSRF-Token');
}