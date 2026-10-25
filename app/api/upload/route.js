import { h, fail } from '@/lib/api';
import { subirArchivo } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export const POST = h(async (req) => {
  const fd = await req.formData();
  const f = fd.get('file');
  const carpeta = fd.get('carpeta') === 'apartamentos' ? 'apartamentos' : 'comprobantes';
  if (!f || typeof f === 'string') throw fail('Falta el archivo');
  const url = await subirArchivo(Buffer.from(await f.arrayBuffer()), f.type || 'image/jpeg', carpeta);
  return { url };
});
