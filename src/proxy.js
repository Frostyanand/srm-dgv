import { NextResponse } from 'next/server';
import { rateLimitProvider } from '@/services/MemoryRateLimitProvider';

export async function proxy(request) {
  const path = request.nextUrl.pathname;

  // 1. CSRF Protection for state-changing methods
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    
    if (origin && new URL(origin).host !== host) {
      // Fire and forget security event
      fetch(`${request.nextUrl.origin}/api/internal/security-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-key': process.env.INTERNAL_API_KEY
        },
        body: JSON.stringify({
          eventType: 'CSRF_FAILURE',
          details: { origin, host, path },
          requestInfo: { ipAddress: request.ip || 'UNKNOWN', userAgent: request.headers.get('user-agent') }
        })
      }).catch(console.error);

      return new NextResponse(JSON.stringify({ error: 'CSRF validation failed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // 2. API Rate Limiting
  if (path.startsWith('/api/')) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
    
    const { isAllowed, remaining, resetTime } = await rateLimitProvider.checkLimit(`ip:${ip}`, 100, 60000);

    if (!isAllowed) {
      fetch(`${request.nextUrl.origin}/api/internal/security-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-key': process.env.INTERNAL_API_KEY
        },
        body: JSON.stringify({
          eventType: 'RATE_LIMIT_TRIGGER',
          details: { path },
          requestInfo: { ipAddress: ip, userAgent: request.headers.get('user-agent') }
        })
      }).catch(console.error);

      return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString()
        },
      });
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    return response;
  }

  // 3. Strict Edge Route Protection (RBAC)
  const protectedRoutes = ['/admin', '/department', '/signatory', '/student'];
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  
  if (isProtectedRoute) {
    const sessionCookie = request.cookies.get('__session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    try {
      // Basic Edge JWT Payload Decoding (Base64Url to JSON)
      const payloadBase64 = sessionCookie.split('.')[1];
      if (!payloadBase64) throw new Error("Invalid Token format");
      
      const payloadString = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadString);
      
      const role = payload.role;
      if (!role) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      // Strict Role-Based Path Validation
      if (path.startsWith('/admin') && role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      // Department upload and submission can be accessed by DEPARTMENT_USER, SIGNATORY (dual capability), and SUPER_ADMIN
      if (path.startsWith('/department') && !['DEPARTMENT_USER', 'SIGNATORY', 'SUPER_ADMIN'].includes(role)) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      if (path.startsWith('/signatory') && !['SIGNATORY', 'SUPER_ADMIN'].includes(role)) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      if (path.startsWith('/student') && !['STUDENT', 'SUPER_ADMIN'].includes(role)) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (e) {
      // If token is malformed or decoding fails, block access
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*', '/department/:path*', '/signatory/:path*', '/student/:path*'],
};
