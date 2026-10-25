'use client';
import { useState } from 'react';
import { post } from '@/lib/client';
export default function Login() {
  const [p, setP] = useState(''), [e, setE] = useState('');
  const go = async () => { try { await post('/api/login', { password: p }); location.href = '/'; } catch (x) { setE(x.message); } };
  return (
    <div className="max-w-xs mx-auto mt-24 bg-white border border-slate-300 rounded p-5 space-y-3">
      <h1 className="text-lg font-semibold">Mi Arriendo</h1>
      <input type="password" className="inp" placeholder="Clave de acceso" value={p} onChange={(x) => setP(x.target.value)} onKeyDown={(x) => x.key === 'Enter' && go()} />
      {e && <p className="text-sm text-rose-600">{e}</p>}
      <button className="btn w-full" onClick={go}>Entrar</button>
    </div>
  );
}
