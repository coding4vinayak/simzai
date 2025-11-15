import { NextRequest } from 'next/server';
import { sign, verify } from 'jsonwebtoken';
import { db } from './db'; // Import database to check session validity

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export function generateToken(payload: any): string {
  return sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function verifyTokenWithSession(token: string): Promise<any> {
  try {
    const decoded = verify(token, JWT_SECRET);
    if (!decoded) return null;

    // Check if the session exists in the database
    const session = await db.session.findUnique({
      where: { token },
    });

    if (!session) {
      return null; // Session doesn't exist or was logged out
    }

    // Check if session has expired
    if (session.expiresAt && new Date() > new Date(session.expiresAt)) {
      // Session has expired, delete it
      await db.session.delete({
        where: { token }
      });
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

export function verifyToken(token: string): any {
  try {
    return verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function validateToken(request: NextRequest): Promise<any> {
  const token = getToken(request);
  if (!token) return null;

  // Check if session is valid in database
  return await verifyTokenWithSession(token);
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