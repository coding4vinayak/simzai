import { NextRequest } from 'next/server';
import { sign, verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export function generateToken(payload: any): string {
  return sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): any {
  try {
    return verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Also check cookies
  const token = request.cookies.get('auth-token')?.value;
  return token || null;
}

export function createAuthResponse(token: string, user: any) {
  const response = {
    user,
    token,
  };

  // Create response with cookie
  const headers = new Headers();
  headers.set('Set-Cookie', `auth-token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict`);

  return new Response(JSON.stringify(response), {
    status: 200,
    headers,
  });
}