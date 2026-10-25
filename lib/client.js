export async function api(url, opt) {
  const r = await fetch(url, opt);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Error');
  return j;
}
export const post = (url, body) => api(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export const money = (n) => '$' + Number(n || 0).toLocaleString('es-CO');
export const fecha = (s) => s ? new Date(s).toLocaleDateString('es-CO', { timeZone: 'America/Bogota', day: '2-digit', month: 'short', year: 'numeric' }) : '';
async function reducir(file) {
  if (!file.type.startsWith('image/')) return file;
  const img = await createImageBitmap(file);
  const s = Math.min(1, 1400 / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = img.width * s; c.height = img.height * s;
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return new Promise((r) => c.toBlob(r, 'image/jpeg', 0.82));
}
// Sube a Supabase Storage (vía /api/upload) y devuelve la URL pública
export async function subir(file, carpeta) {
  const fd = new FormData();
  fd.append('file', await reducir(file), 'archivo');
  fd.append('carpeta', carpeta);
  return (await api('/api/upload', { method: 'POST', body: fd })).url;
}
