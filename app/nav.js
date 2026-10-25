'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
const L = [['/', 'Pagos'], ['/apartamentos', 'Apartamentos'], ['/inquilinos', 'Inquilinos']];
export default function Nav() {
  const p = usePathname();
  if (p === '/login') return null;
  return (
    <header className="bg-emerald-700 text-white">
      <div className="max-w-6xl mx-auto flex items-center px-3 overflow-x-auto">
        <b className="mr-3 py-3 whitespace-nowrap">Mi Arriendo</b>
        {L.map(([h, t]) => (
          <Link key={h} href={h} className={`px-3 py-3 text-sm whitespace-nowrap ${p === h ? 'bg-emerald-900' : 'hover:bg-emerald-600'}`}>{t}</Link>
        ))}
        <button className="ml-auto text-sm px-3 py-3" onClick={async () => { await fetch('/api/login', { method: 'DELETE' }); location.href = '/login'; }}>Salir</button>
      </div>
    </header>
  );
}
