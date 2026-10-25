import crypto from 'crypto';
import { cookies } from 'next/headers';
const token = () => crypto.createHash('sha256').update(process.env.ADMIN_PASSWORD + ':' + process.env.AUTH_SECRET).digest('hex');
export async function POST(req) {
  const { password } = await req.json();
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD)
    return Response.json({ error: 'Clave incorrecta' }, { status: 401 });
  cookies().set('ma', token(), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
  return Response.json({ ok: true });
}
export async function DELETE() {
  cookies().delete('ma');
  return Response.json({ ok: true });
}
