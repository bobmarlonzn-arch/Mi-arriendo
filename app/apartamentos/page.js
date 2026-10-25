'use client';
import { useEffect, useState } from 'react';
import { api, post, money, subir } from '@/lib/client';
const vacio = { nombre: '', direccion: '', caracteristicas: '', valor: '', estado: 'Disponible', fotos: [] };
const color = { Disponible: 'bg-emerald-100 text-emerald-800', Ocupado: 'bg-rose-100 text-rose-800', Agendado: 'bg-amber-100 text-amber-800' };

export default function Aptos() {
  const [rows, setRows] = useState([]), [f, setF] = useState(''), [form, setForm] = useState(null), [err, setErr] = useState(''), [up, setUp] = useState(false);
  const load = () => api('/api/apartamentos' + (f ? '?estado=' + f : '')).then(setRows).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, [f]);
  const set = (k, v) => setForm((x) => ({ ...x, [k]: v }));

  async function fotos(e) {
    setUp(true); setErr('');
    try { const urls = []; for (const x of e.target.files) urls.push(await subir(x, 'apartamentos')); setForm((x) => ({ ...x, fotos: [...x.fotos, ...urls] })); }
    catch (x) { setErr(x.message); }
    setUp(false);
  }
  const guardar = () => post('/api/apartamentos', form).then(() => { setForm(null); setErr(''); load(); }).catch((e) => setErr(e.message));
  const borrar = (id) => confirm('¿Eliminar este apartamento?') && api('/api/apartamentos?id=' + id, { method: 'DELETE' }).then(load).catch((e) => setErr(e.message));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold mr-2">Apartamentos</h1>
        {['', 'Disponible', 'Ocupado', 'Agendado'].map((s) => (
          <button key={s} onClick={() => setF(s)} className={f === s ? 'btn' : 'btn2'}>{s || 'Todos'}</button>
        ))}
        <button className="btn ml-auto" onClick={() => { setForm(vacio); setErr(''); }}>+ Nuevo apartamento</button>
      </div>
      {err && <p className="text-sm rounded p-2 bg-rose-100 text-rose-800">{err}</p>}

      {form && (
        <div className="bg-white border border-slate-300 rounded p-3 grid sm:grid-cols-2 gap-3">
          <label className="text-sm">Número o nombre<input className="inp" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} /></label>
          <label className="text-sm">Valor del arriendo<input className="inp" type="number" value={form.valor} onChange={(e) => set('valor', e.target.value)} /></label>
          <label className="text-sm">Dirección<input className="inp" value={form.direccion || ''} onChange={(e) => set('direccion', e.target.value)} /></label>
          <label className="text-sm">Estado
            <select className="inp" value={form.estado} onChange={(e) => set('estado', e.target.value)}>
              <option>Disponible</option><option>Ocupado</option><option>Agendado</option>
            </select>
          </label>
          <label className="text-sm sm:col-span-2">Características<textarea className="inp" rows="2" value={form.caracteristicas || ''} onChange={(e) => set('caracteristicas', e.target.value)} /></label>
          <div className="sm:col-span-2 text-sm">
            Fotos {up && <span className="text-slate-500">(subiendo…)</span>}
            <div className="flex flex-wrap gap-2 mt-1">
              {form.fotos.map((u) => (
                <div key={u} className="relative">
                  <img src={u} alt="" className="h-16 w-16 object-cover rounded border" />
                  <button className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full w-5 h-5 text-xs" onClick={() => set('fotos', form.fotos.filter((x) => x !== u))}>×</button>
                </div>
              ))}
              <label className="btn2 cursor-pointer self-center">Agregar fotos<input type="file" accept="image/*" multiple className="hidden" onChange={fotos} /></label>
            </div>
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <button className="btn" disabled={up} onClick={guardar}>Guardar</button>
            <button className="btn2" onClick={() => setForm(null)}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="tb">
          <thead><tr><th>Apto</th><th>Dirección</th><th>Características</th><th>Valor</th><th>Estado</th><th>Fotos</th><th></th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan="7" className="text-center text-slate-500 py-6">No hay apartamentos para mostrar.</td></tr>}
            {rows.map((a) => (
              <tr key={a.id}>
                <td className="font-medium">{a.nombre}</td><td>{a.direccion}</td><td className="max-w-xs">{a.caracteristicas}</td><td>{money(a.valor)}</td>
                <td><span className={`rounded px-2 py-0.5 ${color[a.estado]}`}>{a.estado}</span></td>
                <td><div className="flex gap-1">{(a.fotos || []).slice(0, 3).map((u) => <a key={u} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" className="h-9 w-9 object-cover rounded border" /></a>)}</div></td>
                <td className="whitespace-nowrap"><button className="btn2 mr-1" onClick={() => { setForm({ ...a, fotos: a.fotos || [] }); setErr(''); }}>Editar</button><button className="btn2" onClick={() => borrar(a.id)}>Eliminar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
