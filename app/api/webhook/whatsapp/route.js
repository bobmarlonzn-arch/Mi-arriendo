import crypto from 'crypto';
import { sb, subirArchivo } from '@/lib/supabase';
import { media } from '@/lib/wa';
import { tel } from '@/lib/util';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Verificación del webhook (Meta llama una vez al configurarlo)
export async function GET(req) {
  const u = new URL(req.url).searchParams;
  const ok = u.get('hub.mode') === 'subscribe' && process.env.WHATSAPP_VERIFY_TOKEN &&
    u.get('hub.verify_token') === process.env.WHATSAPP_VERIFY_TOKEN;
  return ok ? new Response(u.get('hub.challenge')) : new Response('forbidden', { status: 403 });
}

export async function POST(req) {
  const raw = await req.text();
  const secret = process.env.APP_SECRET;
  if (secret) {
    const exp = 'sha256=' + crypto.createHmac('sha256', secret).update(raw).digest('hex');
    if (req.headers.get('x-hub-signature-256') !== exp) return new Response('firma inválida', { status: 401 });
  }
  try {
    const body = JSON.parse(raw);
    for (const e of body.entry || []) for (const ch of e.changes || []) for (const m of ch.value?.messages || []) {
      if (m.type !== 'image' && m.type !== 'document') continue;
      const { data: dup } = await sb.from('comprobantes').select('id').eq('wamid', m.id).maybeSingle();
      if (dup) continue;
      const { mime, buf } = await media(m[m.type].id);
      const url = await subirArchivo(buf, mime, 'comprobantes');
      const ult = tel(m.from).slice(-10);
      const { data: t } = await sb.from('inquilinos').select('id').eq('activo', true).like('celular', '%' + ult).limit(1);
      const { error } = await sb.from('comprobantes').insert({
        inquilino_id: t?.[0]?.id || null, telefono: tel(m.from), archivo_url: url, estado: 'Pendiente', wamid: m.id,
      });
      if (error) throw new Error(error.message);
    }
    return new Response('ok');
  } catch (err) {
    console.error('webhook', err);
    return new Response('error', { status: 500 }); // Meta reintenta; wamid evita duplicados
  }
}
