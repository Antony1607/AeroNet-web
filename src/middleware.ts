import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const userRole = request.cookies.get('userRole')?.value;
  const { pathname } = request.nextUrl;

  // Si trata de entrar a la raíz, redirigir a login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protección de la zona Admin / Técnico (/dashboard)
  if (pathname.startsWith('/dashboard')) {
    if (!token) return NextResponse.redirect(new URL('/login', request.url));
    if (userRole === 'customer' || userRole === 'prospect') return NextResponse.redirect(new URL('/portal', request.url));
  }

  // Protección de la zona Cliente (/portal)
  if (pathname.startsWith('/portal')) {
    if (!token) return NextResponse.redirect(new URL('/login', request.url));
    if (userRole === 'admin' || userRole === 'technician') return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Si ya tiene token y trata de entrar a páginas de auth, redirigir a su zona
  if ((pathname === '/login' || pathname === '/register' || pathname === '/signup') && token) {
    if (userRole === 'customer' || userRole === 'prospect') {
      return NextResponse.redirect(new URL('/portal', request.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/register', '/signup', '/dashboard/:path*', '/portal/:path*'],
};
