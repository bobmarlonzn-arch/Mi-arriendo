import { createClient } from '@supabase/supabase-js';
// Next 14 cachea fetch: se desactiva para que los datos siempre sean frescos.
export const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) },
});
export const BUCKET = 'comprobantes';
export async function subirArchivo(buf, mime, carpeta) {
  const ext = (mime.split('/')[1] || 'bin').replace('jpeg', 'jpg').replace(/[^a-z0-9]/g, '');
  const path = `${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, buf, { contentType: mime });
  if (error) throw new Error(error.message);
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
