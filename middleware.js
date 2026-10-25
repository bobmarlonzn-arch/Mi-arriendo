import { NextResponse } from 'next/server';
export async function middleware(req) {
  const data = new TextEncoder().encode(process.env.ADMIN_PASSWORD + ':' + process.env.AUTH_SECRET);
  const h = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)))
    .map((b) => b.toString(16).padStart(2, '0')).join('');
  if (req.cookies.get('ma')?.value === h) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith('/api')) return Response.json({ error: 'No autorizado' }, { status: 401 });
  return NextResponse.redirect(new URL('/login', req.url));
}
export const config = { matcher: ['/((?!login|api/login|api/webhook|api/cron|_next|favicon.ico).*)'] };
