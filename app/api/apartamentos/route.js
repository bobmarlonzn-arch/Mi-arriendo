import { sb } from '@/lib/supabase';
import { h, E, fail } from '@/lib/api';
export const dynamic = 'force-dynamic';
export const GET = h(async (req) => {
  const estado = new URL(req.url).searchParams.get('estado');
  let qy = sb.from('apartamentos').select('*').order('nombre');
  if (estado) qy = qy.eq('estado', estado);
  return E(await qy);
});
export const POST = h(async (req) => {
  const b = await req.json();
  if (!b.nombre?.trim()) throw fail('Falta el número o nombre');
  const row = {
    nombre: b.nombre.trim(), direccion: b.direccion || null, caracteristicas: b.caracteristicas || null,
    valor: parseInt(b.valor) || 0, fotos: b.fotos || [], estado: b.estado || 'Disponible',
  };
  E(b.id ? await sb.from('apartamentos').update(row).eq('id', b.id) : await sb.from('apartamentos').insert(row));
  return { ok: true };
});
export const DELETE = h(async (req) => {
  const id = new URL(req.url).searchParams.get('id');
  const r = await sb.from('apartamentos').delete().eq('id', id);
  if (r.error) throw fail('No se puede borrar: tiene inquilinos o pagos asociados', 409);
  return { ok: true };
});
