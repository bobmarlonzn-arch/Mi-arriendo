'use client';
import { Fragment, useEffect, useState } from 'react';
import { api, post, money, fecha } from '@/lib/client';
const vacio = { nombre: '', cedula: '', celular: '', apartamento_id: '', dia_pago: '' };

export default function Inquilinos() {
  const [rows, setRows] = useState([]), [aptos, setAptos] = useState([]), [form, setForm] = useState(null), [err, setErr] = useState(''), [hist, setHist] = useState(null);
  const load = () => Promise.all([api('/api/inquilinos'), api('/api/apartamentos')]).then(([a, b]) => { setRows(a); setAptos(b); }).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);
  const set = (k, v) => setForm((x) => ({ ...x, [k]: v }));
  const guardar = () => post('/api/inquilinos', form).then(() => { setForm(null); setErr(''); load(); }).catch((e) => setErr(e.message));
  const borrar = (id) => confirm('¿Quitar este inquilino? Su historial de pagos se conserva.') && api('/api/inquilinos?id=' + id, { method: 'DELETE' }).then(load).catch((e) => setErr(e.message));
  const verHist = async (id) => hist?.id === id ? setHist(null) : setHist({ id, pagos: await api('/api/pagos?historial=' + id) });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">Inquilinos</h1>
        <button className="btn ml-auto" onClick={() => { setForm(vacio); setErr(''); }}>+ Nuevo inquilino</button>
      </div>
      {err && <p className="text-sm rounded p-2 bg-rose-100 text-rose-800">{err}</p>}

      {form && (
        <div className="bg-white border border-slate-300 rounded p-3 grid sm:grid-cols-2 gap-3">
          <label className="text-sm">Nombre completo<input className="inp" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} /></label>
          <label className="text-sm">Cédula (opcional)<input className="inp" value={form.cedula || ''} onChange={(e) => set('cedula', e.target.value)} /></label>
          <label className="text-sm">Celular con WhatsApp<input className="inp" inputMode="tel" placeholder="3001234567" value={form.celular} onChange={(e) => set('celular', e.target.value)} /></label>
          <label className="text-sm">Apartamento asignado
            <select className="inp" value={form.apartamento_id || ''} onChange={(e) => set('apartamento_id', e.target.value)}>
              <option value="">— Seleccionar —</option>
              {aptos.map((a) => <option key={a.id} value={a.id}>{a.nombre} ({a.estado})</option>)}
            </select>
          </label>
          <label className="text-sm">Día de pago mensual (1-31)<input className="inp" type="number" min="1" max="31" value={form.dia_pago} onChange={(e) => set('dia_pago', e.target.value)} /></label>
          <div className="flex items-end gap-2">
            <button className="btn" onClick={guardar}>Guardar</button>
            <button className="btn2" onClick={() => setForm(null)}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="tb">
          <thead><tr><th>Nombre</th><th>Cédula</th><th>Celular</th><th>Apto</th><th>Día de pago</th><th></th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan="6" className="text-center text-slate-500 py-6">Aún no hay inquilinos.</td></tr>}
            {rows.map((t) => (
              <Fragment key={t.id}>
                <tr>
                  <td className="font-medium">{t.nombre}</td><td>{t.cedula}</td><td>+{t.celular}</td><td>{t.apartamentos?.nombre || '—'}</td><td>{t.dia_pago}</td>
                  <td className="whitespace-nowrap">
                    <button className="btn2 mr-1" onClick={() => verHist(t.id)}>Historial</button>
                    <button className="btn2 mr-1" onClick={() => { setForm({ ...t }); setErr(''); }}>Editar</button>
                    <button className="btn2" onClick={() => borrar(t.id)}>Quitar</button>
                  </td>
                </tr>
                {hist?.id === t.id && (
                  <tr><td colSpan="6" className="bg-slate-50">
                    {hist.pagos.length === 0 ? <span className="text-slate-500">Sin pagos registrados.</span> :
                      hist.pagos.map((p) => <div key={p.periodo}>{p.periodo} · {money(p.valor)} · pagado el {fecha(p.fecha_pago)} {p.comprobante_url && <a className="underline text-blue-700" href={p.comprobante_url} target="_blank" rel="noreferrer">comprobante</a>}</div>)}
                  </td></tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
