import Link from "next/link";

export function SiteHeader({ solid = false }: { solid?: boolean }) {
  return (
    <header className={`site-header${solid ? " site-header-solid" : ""}`}>
      <Link className="brand" href="/" aria-label="Vmax home">
        <span className="brand-mark" aria-hidden="true" />
        <span>VMAX</span>
      </Link>
      <nav className="primary-nav" aria-label="Primary navigation">
        <Link href="/how-it-works">How it works</Link>
        <Link href="/laps">Lap status</Link>
        <Link href="/docs">Docs</Link>
        <Link href="/faq">FAQ</Link>
      </nav>
      <Link className="header-cta" href="/dashboard">
        Open dashboard
        <span aria-hidden="true">↗</span>
      </Link>
      <details className="mobile-menu">
        <summary aria-label="Open navigation">Menu</summary>
        <nav aria-label="Mobile navigation">
          <Link href="/how-it-works">How it works</Link>
          <Link href="/laps">Lap status</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/presentation">Presentation</Link>
        </nav>
      </details>
    </header>
  );
}
