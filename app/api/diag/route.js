export const dynamic = 'force-dynamic';
export async function GET() {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  let tipo = 'VACÍA';
  if (k.startsWith('sb_secret_')) tipo = 'secret key nueva';
  else if (k.startsWith('sb_publishable_')) tipo = 'publishable (INCORRECTA)';
  else if (k.startsWith('eyJ')) {
    try { tipo = 'JWT con rol: ' + JSON.parse(Buffer.from(k.split('.')[1], 'base64url').toString()).role; }
    catch { tipo = 'JWT ilegible'; }
  } else if (k) tipo = 'formato desconocido';
  return Response.json({ tipo, largo: k.length, url: process.env.SUPABASE_URL });
}
