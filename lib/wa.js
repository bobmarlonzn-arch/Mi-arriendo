const G = 'https://graph.facebook.com/v21.0';
const H = () => ({ Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` });
async function post(body) {
  if (!process.env.WHATSAPP_TOKEN || !process.env.PHONE_ID) throw new Error('Faltan WHATSAPP_TOKEN / PHONE_ID');
  const r = await fetch(`${G}/${process.env.PHONE_ID}/messages`, {
    method: 'POST',
    headers: { ...H(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...body }),
    cache: 'no-store',
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error?.message || 'Error de WhatsApp ' + r.status);
  return j;
}
export const sendText = (to, text) => post({ to, type: 'text', text: { body: text } });
export const sendTemplate = (to, params) => post({
  to, type: 'template',
  template: {
    name: process.env.WHATSAPP_TEMPLATE_NAME || 'recordatorio_arriendo',
    language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'es' },
    components: [{ type: 'body', parameters: params.map((t) => ({ type: 'text', text: String(t) })) }],
  },
});
export async function media(id) {
  const m = await (await fetch(`${G}/${id}`, { headers: H(), cache: 'no-store' })).json();
  if (!m.url) throw new Error('No se pudo obtener el archivo de WhatsApp');
  const r = await fetch(m.url, { headers: H(), cache: 'no-store' });
  return { mime: m.mime_type || 'image/jpeg', buf: Buffer.from(await r.arrayBuffer()) };
}
