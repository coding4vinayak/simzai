// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

// List of public routes that don't require authentication
const publicRoutes = ['/', '/login', '/register', '/api/auth/login', '/api/auth/register', '/api/check-db', '/api/sdk'];

export function middleware(request: NextRequest) {
  // Add security headers
  const response = NextResponse.next();
  
  // Content Security Policy
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; base-uri 'self'; font-src 'self' https: data:; img-src 'self' https: data:; object-src 'none'; script-src 'self'; style-src 'self' https: 'unsafe-inline'"
  );
  
  // X-Frame-Options
  response.headers.set('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // X-XSS-Protection (deprecated but still useful for older browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Strict Transport Security
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Check if trying to access a protected route
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );
  
  if (!isPublicRoute) {
    // For protected routes, check authentication
    const authHeader = request.headers.get('authorization');
    const cookie = request.cookies.get('auth-token');
    
    // If no auth header and no cookie, redirect to login
    if (!authHeader && !cookie) {
      // For API routes, return 401 instead of redirect
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }
  }
  
  return response;
}

// Specify which routes the middleware should run for
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) 
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};