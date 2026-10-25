import { sb } from '@/lib/supabase';
import { h, E, fail } from '@/lib/api';
import { sendText } from '@/lib/wa';
import { perActual, per, MESES, tel } from '@/lib/util';
export const dynamic = 'force-dynamic';

export const GET = h(async (req) => {
  const hist = new URL(req.url).searchParams.get('historial');
  if (hist) return E(await sb.from('pagos').select('periodo,valor,fecha_pago,comprobante_url').eq('inquilino_id', hist).order('periodo', { ascending: false }));

  const periodo = perActual();
  const ts = E(await sb.from('inquilinos').select('id,nombre,celular,dia_pago,apartamentos(nombre,valor)').eq('activo', true).order('nombre'));
  const ps = E(await sb.from('pagos').select('inquilino_id,fecha_pago,comprobante_url').eq('periodo', periodo));
  const cs = E(await sb.from('comprobantes').select('id,inquilino_id,telefono,archivo_url,fecha_recepcion,inquilinos(nombre)').eq('estado', 'Pendiente').order('fecha_recepcion', { ascending: false }));
  const filas = ts.map((t) => {
    const p = ps.find((x) => x.inquilino_id === t.id);
    return { ...t, pagado: !!p, fecha_pago: p?.fecha_pago, comprobante_url: p?.comprobante_url };
  }).sort((a, b) => a.pagado - b.pagado || a.nombre.localeCompare(b.nombre));
  return { periodo, filas, alertas: cs };
});

// Confirmar pago
export const POST = h(async (req) => {
  const { inquilino_id, comprobante_url } = await req.json();
  const t = E(await sb.from('inquilinos').select('id,nombre,celular,apartamentos(valor)').eq('id', inquilino_id).single());
  const existe = async (p) => E(await sb.from('pagos').select('id').eq('inquilino_id', t.id).eq('periodo', p).maybeSingle());

  let periodo = perActual();
  if (await existe(periodo)) {            // ya pagó este mes: se abona al mes siguiente
    const [y, m] = periodo.split('-').map(Number);
    periodo = per(new Date(Date.UTC(y, m, 1)));
    if (await existe(periodo)) throw fail('Este inquilino ya está al día');
  }
  let url = comprobante_url || null;
  if (!url) {
    const c = E(await sb.from('comprobantes').select('archivo_url').eq('inquilino_id', t.id).eq('estado', 'Pendiente').order('fecha_recepcion', { ascending: false }).limit(1));
    url = c[0]?.archivo_url || null;
  }
  E(await sb.from('pagos').insert({ inquilino_id: t.id, periodo, valor: t.apartamentos?.valor || 0, comprobante_url: url }));
  await sb.from('comprobantes').update({ estado: 'Confirmado' }).eq('inquilino_id', t.id).eq('estado', 'Pendiente');

  const mes = MESES[Number(periodo.slice(5)) - 1];
  try {
    await sendText(tel(t.celular), `Hemos recibido su pago correctamente. Quedó al día con ${mes}. ¡Gracias!`);
    return { ok: true, wa: true };
  } catch (e) {
    return { ok: true, wa: false, error: e.message };
  }
});
