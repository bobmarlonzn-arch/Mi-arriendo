import './globals.css';
import Nav from './nav';
export const metadata = { title: 'Mi Arriendo' };
export default function Layout({ children }) {
  return (
    <html lang="es">
      <body className="bg-slate-100 text-slate-800">
        <Nav />
        <main className="max-w-6xl mx-auto p-3 sm:p-5">{children}</main>
      </body>
    </html>
  );
}
