import type { Metadata } from "next"; import "./globals.css"; import Link from "next/link";
export const metadata: Metadata = { title: "Incident Manager", description: "Seguimiento de incidencias" };
export default function RootLayout({children}:{children:React.ReactNode}){ return (<html lang="es"><body><div className="container py-6">
<header className="mb-6 flex items-center justify-between">
  <Link href="/incidents" className="text-xl font-semibold">Incident Manager</Link>
  <nav className="flex gap-4"><Link className="btn" href="/incidents">Incidencias</Link><Link className="btn" href="/incidents/new">Nueva incidencia</Link></nav>
</header>{children}</div></body></html>); }