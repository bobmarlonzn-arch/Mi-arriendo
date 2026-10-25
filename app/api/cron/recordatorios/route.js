import { sb } from '@/lib/supabase';
import { h, E, fail } from '@/lib/api';
import { sendTemplate } from '@/lib/wa';
import { hoyCO, dueDate, per, MESES, money, tel } from '@/lib/util';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Vercel Cron llama este endpoint con "Authorization: Bearer CRON_SECRET".
// Para pruebas manuales: /api/cron/recordatorios?key=CRON_SECRET
export const GET = h(async (req) => {
  const S = process.env.CRON_SECRET;
  const key = new URL(req.url).searchParams.get('key');
  if (!S || (req.headers.get('authorization') !== `Bearer ${S}` && key !== S)) throw fail('No autorizado', 401);

  const t0 = hoyCO();
  const hoy = Date.UTC(t0.y, t0.m, t0.d);
  const ts = E(await sb.from('inquilinos').select('id,nombre,celular,dia_pago,apartamentos!inner(nombre,valor)').eq('activo', true));
  const out = [];

  for (const t of ts) for (const off of [0, 1]) {
    const due = dueDate(t0.y, t0.m + off, t.dia_pago);
    const dias = Math.round((due - hoy) / 864e5);
    // Objetivo: 5 días antes. Si un envío falló, reintenta los días siguientes hasta el vencimiento.
    if (dias < 0 || dias > 5) continue;
    const periodo = per(due);
    const pago = E(await sb.from('pagos').select('id').eq('inquilino_id', t.id).eq('periodo', periodo).maybeSingle());
    const rec = E(await sb.from('recordatorios').select('enviado').eq('inquilino_id', t.id).eq('periodo', periodo).maybeSingle());
    if (pago || rec?.enviado) continue;
    const fila = { inquilino_id: t.id, periodo, actualizado: new Date().toISOString() };
    try {
      await sendTemplate(tel(t.celular), [t.nombre, t.apartamentos.nombre, `${due.getUTCDate()} de ${MESES[due.getUTCMonth()]}`, money(t.apartamentos.valor)]);
      await sb.from('recordatorios').upsert({ ...fila, enviado: true, error: null });
      out.push({ inquilino: t.nombre, periodo, ok: true });
    } catch (e) {
      await sb.from('recordatorios').upsert({ ...fila, enviado: false, error: e.message.slice(0, 250) });
      out.push({ inquilino: t.nombre, periodo, ok: false, error: e.message });
    }
  }
  return { fecha: `${t0.y}-${t0.m + 1}-${t0.d}`, revisados: ts.length, enviados: out };
});
