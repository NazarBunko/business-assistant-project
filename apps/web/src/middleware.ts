import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const publicPages = ['/login', '/register', '/'];

export default function middleware(req: NextRequest) {
  const publicPathnameRegex = RegExp(
    `^(/(${routing.locales.join('|')}))?(${publicPages
      .flatMap((p) => (p === '/' ? ['', '/'] : p))
      .join('|')})/?$`,
    'i'
  );
  
  const isPublicPage = publicPathnameRegex.test(req.nextUrl.pathname);

  const token = req.cookies.get('accessToken')?.value;

  if (!isPublicPage && !token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isPublicPage && token && req.nextUrl.pathname !== '/') {
     return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};