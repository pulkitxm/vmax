import type { Metadata } from "next";
import Link from "next/link";

import { DecisionStory } from "@/components/decision-story";
import { KartRaceScene } from "@/components/kart-race-scene";
import { ScrollMotion } from "@/components/scroll-motion";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Vmax",
    url: "https://vmax.pulkit.page",
    description:
      "Vmax builds JouleIQ, an explainable energy-aware race-intelligence system.",
  };

  return (
    <main className="site-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ScrollMotion />
      <SiteHeader />

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-sticky">
          <KartRaceScene />
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-kicker">
            <span>Race intelligence</span>
            <span>Scroll to inspect</span>
          </div>
          <div className="hero-copy">
            <p className="eyebrow">Introducing JouleIQ</p>
            <h1 id="hero-title">
              Every joule
              <span>changes the race.</span>
            </h1>
            <p className="hero-lede">
              Vmax prices the future value of energy and gives the engineer one
              explainable call.
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
            className="hero-model-label"
            aria-label="Animated formation of four low-poly race karts"
          >
            <span>Four kart formation</span>
            <strong>JQ GRID 04</strong>
            <small>Scroll controlled · WebGL</small>
          </div>
          <div className="scroll-cue" aria-hidden="true">
            <span>Scroll to rotate</span>
            <i />
          </div>
        </div>
      </section>

      <div className="signal-strip" aria-label="JouleIQ system capabilities">
        <span>F1 25 telemetry</span>
        <span>Fast digital twin</span>
        <span>Monte Carlo futures</span>
        <span>Risk-aware advice</span>
        <span>Physical energy proof</span>
      </div>

      <section className="thesis-section" id="system">
        <div className="thesis-heading" data-reveal>
          <p className="eyebrow">A new race-strategy primitive</p>
          <h2>The fastest move now can lose the race later.</h2>
        </div>
        <div className="thesis-grid">
          <p className="thesis-lede" data-reveal>
            Stored energy is a finite option. Spend it in a low-value window and
            the decisive window may arrive with nothing left. JouleIQ asks a
            better question: where does the next joule change race outcome most?
          </p>
          <div className="value-chart" data-reveal>
            <div className="chart-labels">
              <span>Value per joule</span>
              <span>Race progress →</span>
            </div>
            <div
              className="chart-plot"
              aria-label="Projected future energy value"
            >
              <div className="chart-grid" aria-hidden="true" />
              <div className="chart-line" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="chart-marker marker-now">
                <b>1.3</b>
                <span>Spend now</span>
              </div>
              <div className="chart-marker marker-later">
                <b>4.8</b>
                <span>Attack window</span>
              </div>
            </div>
          </div>
        </div>
        <div className="thesis-metric" data-reveal>
          <span>Projected marginal value</span>
          <strong>3.7×</strong>
          <p>higher at the next attack window</p>
        </div>
      </section>

      <DecisionStory />

      <section className="system-section" aria-labelledby="system-title">
        <div className="system-heading" data-reveal>
          <p className="eyebrow">Built for evidence</p>
          <h2 id="system-title">From packet to joule.</h2>
          <p>
            F1 25 is the high-fidelity reference world. A fast programmable twin
            explores futures. The same recommendation is measured on real
            embedded hardware.
          </p>
        </div>
        <ol className="system-flow" data-reveal>
          <li>
            <span>01</span>
            <small>Reference</small>
            <strong>F1 25 telemetry</strong>
            <p>Live 2026 race state over the official UDP format.</p>
          </li>
          <li>
            <span>02</span>
            <small>Intelligence</small>
            <strong>JouleIQ twin</strong>
            <p>Counterfactual planning with long-horizon value and risk.</p>
          </li>
          <li>
            <span>03</span>
            <small>Decision</small>
            <strong>Engineer advice</strong>
            <p>One action, confidence, energy cost, and a clear reason.</p>
          </li>
          <li>
            <span>04</span>
            <small>Proof</small>
            <strong>Physical HIL</strong>
            <p>
              ESP32 control with measured voltage, current, power, and joules.
            </p>
          </li>
        </ol>
      </section>

      <section className="proof-section" aria-labelledby="proof-title">
        <div className="proof-copy" data-reveal>
          <p className="eyebrow">The physical proof</p>
          <h2 id="proof-title">The decision leaves a trace.</h2>
          <p>
            Advice drives a calibrated ESP32 motor command. An INA219 measures
            the electrical consequence, turning strategy into a real energy
            curve the audience can see.
          </p>
          <Link className="text-link" href="/how-it-works#hardware">
            Follow the full signal path <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="proof-console" data-reveal>
          <div className="console-header">
            <span>PHYSICAL HIL</span>
            <span className="status-dot">LINKED</span>
          </div>
          <div className="console-mode">
            <span>MODE</span>
            <strong>ATTACK</strong>
          </div>
          <div className="console-readings">
            <span>
              Voltage <b>7.31 V</b>
            </span>
            <span>
              Current <b>0.44 A</b>
            </span>
            <span>
              Power <b>3.22 W</b>
            </span>
            <span>
              Run energy <b>12.8 J</b>
            </span>
          </div>
          <div className="energy-trace" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
      </section>

      <section
        className="principles-section"
        aria-labelledby="principles-title"
      >
        <div data-reveal>
          <p className="eyebrow">No black-box theatre</p>
          <h2 id="principles-title">Fast. Honest. Explainable.</h2>
        </div>
        <div className="principle-cards">
          <article data-reveal>
            <span>01 / Human</span>
            <h3>Advice, not autonomous driving.</h3>
            <p>The engineer remains in control of every race decision.</p>
          </article>
          <article data-reveal>
            <span>02 / Risk</span>
            <h3>Tail outcomes stay visible.</h3>
            <p>Mean upside never hides the worst plausible futures.</p>
          </article>
          <article data-reveal>
            <span>03 / Evidence</span>
            <h3>Every call can be replayed.</h3>
            <p>
              State, seeds, models, choices, and hardware ACKs are recorded.
            </p>
          </article>
        </div>
      </section>

      <section className="final-cta" data-reveal>
        <p className="eyebrow">Go deeper</p>
        <h2>See how JouleIQ thinks.</h2>
        <div>
          <Link className="button button-primary" href="/how-it-works">
            How it works <span aria-hidden="true">↗</span>
          </Link>
          <Link className="button button-outline" href="/docs">
            Read the docs <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
