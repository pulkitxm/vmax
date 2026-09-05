import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <Link className="brand" href="/" aria-label="Vmax home">
          <span className="brand-mark" aria-hidden="true" />
          <span>VMAX</span>
        </Link>
        <p>Race intelligence for the energy era.</p>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/laps">Lap status</Link>
        <Link href="/how-it-works">How it works</Link>
        <Link href="/docs">Documentation</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/presentation">Presentation</Link>
      </nav>
      <span className="footer-signal">System concept · 2026</span>
    </footer>
  );
}
