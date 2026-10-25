'use client';
import { useEffect, useState, useCallback } from 'react';
import { api, post, money, fecha, subir } from '@/lib/client';

export default function Pagos() {
  const [d, setD] = useState(null), [files, setFiles] = useState({}), [busy, setBusy] = useState(null), [msg, setMsg] = useState(null);
  const load = useCallback(() => api('/api/pagos').then(setD).catch((e) => setMsg({ e: e.message })), []);
  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i); }, [load]);

  async function confirmar(id) {
    if (!confirm('¿Confirmar el pago? Se enviará un WhatsApp al inquilino.')) return;
    setBusy(id);
    try {
      const url = files[id] ? await subir(files[id], 'comprobantes') : null;
      const r = await post('/api/pagos', { inquilino_id: id, comprobante_url: url });
      setMsg(r.wa ? { ok: 'Pago confirmado y WhatsApp enviado.' } : { e: 'Pago confirmado, pero el WhatsApp no se envió: ' + r.error });
      setFiles((f) => ({ ...f, [id]: null }));
      await load();
    } catch (e) { setMsg({ e: e.message }); }
    setBusy(null);
  }
  if (!d) return <p>{msg?.e || 'Cargando…'}</p>;
  const ok = d.filas.filter((f) => f.pagado).length;
  const mes = new Date(d.periodo + '-02').toLocaleDateString('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold capitalize">Pagos de {mes}</h1>
        <span className="text-sm bg-emerald-100 text-emerald-800 rounded px-2 py-0.5">Pagaron: {ok}</span>
        <span className="text-sm bg-rose-100 text-rose-800 rounded px-2 py-0.5">Pendientes: {d.filas.length - ok}</span>
      </div>
      {msg && <p className={`text-sm rounded p-2 ${msg.e ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>{msg.e || msg.ok}</p>}

      {d.alertas.map((a) => (
        <div key={a.id} className="bg-amber-100 border border-amber-300 rounded p-2 flex flex-wrap items-center gap-3 text-sm">
          <a href={a.archivo_url} target="_blank" rel="noreferrer"><img src={a.archivo_url} alt="comprobante" className="h-14 w-14 object-cover rounded border" /></a>
          <span><b>{a.inquilinos?.nombre || `Número desconocido (+${a.telefono})`}</b> envió comprobante · {fecha(a.fecha_recepcion)}</span>
          <a className="underline text-blue-700" href={a.archivo_url} target="_blank" rel="noreferrer">Ver imagen</a>
          {a.inquilino_id && <button className="btn ml-auto" disabled={busy === a.inquilino_id} onClick={() => confirmar(a.inquilino_id)}>Confirmar pago</button>}
        </div>
      ))}

      <div className="overflow-x-auto">
        <table className="tb">
          <thead><tr><th></th><th>Inquilino</th><th>Apto</th><th>Valor</th><th>Día</th><th>Estado</th><th>Acción</th></tr></thead>
          <tbody>
            {d.filas.length === 0 && <tr><td colSpan="7" className="text-center text-slate-500 py-6">Aún no hay inquilinos. Crea uno en la pestaña Inquilinos.</td></tr>}
            {d.filas.map((f) => (
              <tr key={f.id}>
                <td><span className={`inline-block w-4 h-4 rounded-full ${f.pagado ? 'bg-emerald-500' : 'bg-rose-500'}`} title={f.pagado ? 'Pagó' : 'No ha pagado'} /></td>
                <td className="font-medium">{f.nombre}</td>
                <td>{f.apartamentos?.nombre || '—'}</td>
                <td>{money(f.apartamentos?.valor)}</td>
                <td>{f.dia_pago}</td>
                <td>{f.pagado ? <>Pagó {fecha(f.fecha_pago)} {f.comprobante_url && <a className="underline text-blue-700" href={f.comprobante_url} target="_blank" rel="noreferrer">comprobante</a>}</> : 'Pendiente'}</td>
                <td>
                  {!f.pagado && (
                    <div className="flex items-center gap-2">
                      <button className="btn" disabled={busy === f.id} onClick={() => confirmar(f.id)}>{busy === f.id ? 'Enviando…' : 'Confirmar pago'}</button>
                      <label className="btn2 cursor-pointer" title="Adjuntar comprobante (opcional)">
                        {files[f.id] ? '✔ Adjunto' : 'Adjuntar'}
                        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setFiles({ ...files, [f.id]: e.target.files[0] })} />
                      </label>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
