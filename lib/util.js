export const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
// Hora de Colombia (UTC-5, sin horario de verano)
export const hoyCO = () => {
  const d = new Date(Date.now() - 5 * 3600e3);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() };
};
export const dueDate = (y, m, day) => {
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(day, last)));
};
export const per = (dt) => dt.toISOString().slice(0, 7);
export const perActual = () => { const t = hoyCO(); return per(new Date(Date.UTC(t.y, t.m, 1))); };
export const money = (n) => '$' + Number(n || 0).toLocaleString('es-CO');
export const tel = (s) => { const d = String(s || '').replace(/\D/g, ''); return d.length === 10 ? '57' + d : d; };
