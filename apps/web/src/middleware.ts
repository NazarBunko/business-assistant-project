import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const publicPages = ['/login', '/register', '/', '/admin', '/admin/login'];

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
  const publicPathnameRegex = RegExp(
    `^(/(${routing.locales.join('|')}))?(${publicPages
      .flatMap((p) => (p === '/' ? ['', '/'] : p))
      .join('|')})/?$`,
    'i'
  );
  
  const isPublicPage = publicPathnameRegex.test(pathname);

  const token = req.cookies.get('accessToken')?.value;

  if (!isPublicPage && !token && !pathname.includes('/admin')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isPublicPage && token && pathname !== '/' && !pathname.includes('/admin')) {
     return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};