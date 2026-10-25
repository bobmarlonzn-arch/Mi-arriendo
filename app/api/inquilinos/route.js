import { sb } from '@/lib/supabase';
import { h, E, fail } from '@/lib/api';
import { tel } from '@/lib/util';
export const dynamic = 'force-dynamic';

async function liberar(aptId) {
  if (!aptId) return;
  const otros = E(await sb.from('inquilinos').select('id').eq('apartamento_id', aptId).eq('activo', true));
  if (!otros.length) await sb.from('apartamentos').update({ estado: 'Disponible' }).eq('id', aptId);
}
export const GET = h(async () =>
  E(await sb.from('inquilinos').select('*, apartamentos(nombre,valor)').eq('activo', true).order('nombre')));

export const POST = h(async (req) => {
  const b = await req.json();
  const dia = parseInt(b.dia_pago);
  if (!b.nombre?.trim()) throw fail('Falta el nombre');
  if (!tel(b.celular)) throw fail('Falta el celular');
  if (!(dia >= 1 && dia <= 31)) throw fail('El día de pago debe ser entre 1 y 31');
  const row = {
    nombre: b.nombre.trim(), cedula: b.cedula || null, celular: tel(b.celular),
    apartamento_id: b.apartamento_id ? Number(b.apartamento_id) : null, dia_pago: dia,
  };
  let anterior = null;
  if (b.id) {
    anterior = E(await sb.from('inquilinos').select('apartamento_id').eq('id', b.id).single()).apartamento_id;
    E(await sb.from('inquilinos').update(row).eq('id', b.id));
  } else E(await sb.from('inquilinos').insert(row));
  if (row.apartamento_id) await sb.from('apartamentos').update({ estado: 'Ocupado' }).eq('id', row.apartamento_id);
  if (anterior && anterior !== row.apartamento_id) await liberar(anterior);
  return { ok: true };
});

// "Eliminar" = archivar: conserva el historial de pagos
export const DELETE = h(async (req) => {
  const id = new URL(req.url).searchParams.get('id');
  const t = E(await sb.from('inquilinos').select('apartamento_id').eq('id', id).single());
  E(await sb.from('inquilinos').update({ activo: false, apartamento_id: null }).eq('id', id));
  await liberar(t.apartamento_id);
  return { ok: true };
});
