import Link from "next/link";

import { HeroShader } from "@/components/hero-shader";

export default function Home() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Vmax home">
          <span className="brand-mark" aria-hidden="true" />
          <span>VMAX</span>
        </Link>
        <nav className="primary-nav" aria-label="Primary navigation">
          <Link href="/how-it-works">How it works</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/faq">FAQ</Link>
        </nav>
        <Link className="header-cta" href="#system">
          Explore JouleIQ
          <span aria-hidden="true">↘</span>
        </Link>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <HeroShader />
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-kicker">
          <span>Race intelligence</span>
          <span>2026 energy era</span>
        </div>
        <div className="hero-copy">
          <p className="eyebrow">Introducing JouleIQ</p>
          <h1 id="hero-title">
            Every joule
            <span>changes the race.</span>
          </h1>
          <p className="hero-lede">
            Vmax prices the future value of energy, compares uncertain race
            futures, and gives the engineer one explainable call.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="#system">
              See the system
              <span aria-hidden="true">↓</span>
            </Link>
            <Link className="text-link" href="/how-it-works">
              How it works
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <div
          className="hero-telemetry"
          aria-label="Example JouleIQ recommendation"
        >
          <div className="telemetry-topline">
            <span>Live decision</span>
            <span className="status-dot">Nominal</span>
          </div>
          <strong>ELIGIBILITY PUSH</strong>
          <div className="telemetry-values">
            <span>
              Energy cost <b>0.14 MJ</b>
            </span>
            <span>
              Confidence <b>87%</b>
            </span>
          </div>
        </div>
        <div className="scroll-cue" aria-hidden="true">
          <span>Scroll to simulate</span>
          <i />
        </div>
      </section>

      <section className="preview-section" id="system">
        <p className="eyebrow">A new race-strategy primitive</p>
        <h2>The fastest move now can lose the race later.</h2>
      </section>
    </main>
  );
}
