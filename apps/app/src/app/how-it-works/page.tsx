import Link from "next/link";

import { ScrollMotion } from "@/components/scroll-motion";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "How JouleIQ Works",
  "Follow the JouleIQ decision loop from F1 25 telemetry through counterfactual planning, risk analysis, engineer advice, and physical energy measurement.",
  "/how-it-works",
);

const actions = [
  "Conserve",
  "Hold",
  "Pressure",
  "Eligibility push",
  "Attack",
  "Defend",
];

export default function HowItWorksPage() {
  return (
    <main className="interior-shell">
      <ScrollMotion />
      <SiteHeader />
      <section className="interior-hero">
        <div>
          <p className="eyebrow">How it works</p>
          <h1>One live state. Thousands of possible futures.</h1>
          <p>
            JouleIQ turns race telemetry into a risk-aware recommendation by
            pricing energy across time, not just the next straight.
          </p>
        </div>
        <div className="interior-hero-index" aria-hidden="true">
          01→05
        </div>
      </section>

      <section className="process-section" aria-label="JouleIQ process">
        <article className="process-row" data-reveal>
          <div className="process-number">01</div>
          <div className="process-copy">
            <p>Observe</p>
            <h2>Build a trusted race state.</h2>
            <div>
              F1 25 sends live 2026 telemetry over UDP. JouleIQ assembles speed,
              lap, gap, energy, active-aero state, and overtake availability
              into one normalized state that can be recorded and replayed.
            </div>
          </div>
          <div className="telemetry-pulse" aria-label="Example race telemetry">
            <span>
              SPEED <b>319 km/h</b>
            </span>
            <span>
              GAP <b>1.06 s</b>
            </span>
            <span>
              ENERGY <b>43%</b>
            </span>
            <span>
              OVERTAKE <b>LOCKED</b>
            </span>
          </div>
        </article>

        <article className="process-row process-row-dark" data-reveal>
          <div className="process-number">02</div>
          <div className="process-copy">
            <p>Imagine</p>
            <h2>Run the race forward six ways.</h2>
            <div>
              The fast digital twin clones the current state and evaluates every
              valid action under matched samples of opponent behavior, harvest,
              traffic, tyre variation, pass outcomes, and model error.
            </div>
          </div>
          <div className="future-grid">
            {actions.map((action, index) => (
              <span key={action}>
                <i style={{ width: `${48 + index * 8}%` }} />
                <b>{action}</b>
                <small>512 futures</small>
              </span>
            ))}
          </div>
        </article>

        <article className="process-row" data-reveal>
          <div className="process-number">03</div>
          <div className="process-copy">
            <p>Value</p>
            <h2>Find the moment energy changes the outcome.</h2>
            <div>
              Energy shadow price measures the projected marginal value of
              stored energy. Eligibility value captures threshold effects, such
              as a small push that makes a larger later overtake possible.
            </div>
          </div>
          <div className="eligibility-card">
            <span>Probability of eligibility</span>
            <div>
              <small>Hold</small>
              <strong>34%</strong>
            </div>
            <div>
              <small>Push</small>
              <strong>81%</strong>
            </div>
            <p>0.14 MJ creates a 47 point probability gain.</p>
          </div>
        </article>

        <article className="process-row process-row-red" data-reveal>
          <div className="process-number">04</div>
          <div className="process-copy">
            <p>Decide</p>
            <h2>Balance upside against the adverse tail.</h2>
            <div>
              JouleIQ compares mean outcome with lower-tail risk, applies rule
              and safety constraints, then reports confidence as empirical
              support from repeated counterfactual evaluations.
            </div>
          </div>
          <div className="risk-card">
            <div>
              <span>Action</span>
              <span>Mean</span>
              <span>Worst 10%</span>
            </div>
            <div>
              <b>Elig push</b>
              <b>P7.2</b>
              <b>P7.9</b>
            </div>
            <div>
              <span>Attack</span>
              <span>P7.1</span>
              <span>P9.0</span>
            </div>
          </div>
        </article>

        <article className="process-row" id="hardware" data-reveal>
          <div className="process-number">05</div>
          <div className="process-copy">
            <p>Prove</p>
            <h2>Measure the electrical consequence.</h2>
            <div>
              The recommendation drives a calibrated ESP32-S3 motor mode. An
              INA219 samples voltage and current, allowing the system to
              integrate real power into real joules while watchdogs keep stale
              commands safe.
            </div>
          </div>
          <div className="hardware-path" aria-label="Hardware signal path">
            <span>
              Advice <b>ATTACK</b>
            </span>
            <i>→</i>
            <span>
              ESP32 <b>PWM + TTL</b>
            </span>
            <i>→</i>
            <span>
              INA219 <b>V × I × Δt</b>
            </span>
          </div>
        </article>
      </section>

      <section className="interior-cta" data-reveal>
        <p className="eyebrow">Implementation detail</p>
        <h2>Ready for the architecture?</h2>
        <Link className="button button-primary" href="/docs">
          Read the docs <span aria-hidden="true">→</span>
        </Link>
      </section>
      <SiteFooter />
    </main>
  );
}
