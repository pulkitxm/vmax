import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "JouleIQ Documentation",
  "Technical documentation for the JouleIQ telemetry, digital twin, decision intelligence, embedded hardware, and validation architecture.",
  "/docs",
);

const sections = [
  ["overview", "System overview"],
  ["telemetry", "Telemetry"],
  ["twin", "Digital twin"],
  ["decision", "Decision intelligence"],
  ["hardware", "Hardware loop"],
  ["validation", "Validation"],
];

export default function DocsPage() {
  return (
    <main className="docs-shell">
      <SiteHeader />
      <section className="docs-hero">
        <p className="eyebrow">JouleIQ documentation</p>
        <h1>Build the intelligence. Prove the decision.</h1>
        <p>
          A practical guide to the race-intelligence stack, from official game
          telemetry to a reproducible recommendation and measured energy trace.
        </p>
      </section>

      <div className="docs-layout">
        <aside className="docs-sidebar">
          <span>On this page</span>
          <nav aria-label="Documentation sections">
            {sections.map(([id, label]) => (
              <Link href={`#${id}`} key={id}>
                {label}
              </Link>
            ))}
          </nav>
          <Link className="docs-source" href="/presentation">
            Open presentation ↗
          </Link>
        </aside>

        <article className="docs-content">
          <section id="overview">
            <p className="docs-label">01 · Overview</p>
            <h2>System overview</h2>
            <p>
              JouleIQ is a human-facing race-intelligence system. F1 25 supplies
              the high-fidelity reference state. A calibrated strategic twin
              supplies programmable counterfactuals. A risk and rule layer turns
              those futures into one recommendation for the engineer.
            </p>
            <div className="docs-callout">
              <strong>Core decision loop</strong>
              <code>
                state → belief → actions → futures → risk → shield → advice
              </code>
            </div>
            <div className="docs-cards">
              <div>
                <span>Input</span>
                <strong>Official UDP telemetry</strong>
              </div>
              <div>
                <span>Decision target</span>
                <strong>Under 200 ms p95</strong>
              </div>
              <div>
                <span>Output</span>
                <strong>Action + reason + TTL</strong>
              </div>
            </div>
          </section>

          <section id="telemetry">
            <p className="docs-label">02 · Reference world</p>
            <h2>Telemetry and replay</h2>
            <p>
              The Windows racing machine runs F1 25 and emits the 2026 UDP
              packet format. The Ubuntu server records raw packets, assembles
              frames, and converts them into a stable normalized state for live
              and replay use.
            </p>
            <pre>
              <code>{`{
  "lap": 42,
  "position": 8,
  "energy_frac": 0.43,
  "gap_front_s": 1.06,
  "action": "ELIGIBILITY_PUSH",
  "confidence": 0.87,
  "ttl_ms": 1800
}`}</code>
            </pre>
            <h3>Design boundary</h3>
            <p>
              F1 25 calibrates and validates the system. It is not used as a
              programmable training environment because telemetry output does
              not provide fast reset, state cloning, or millions of external
              steps.
            </p>
          </section>

          <section id="twin">
            <p className="docs-label">03 · Programmable world</p>
            <h2>Fast digital twin</h2>
            <p>
              The strategic surrogate models track segments, energy transitions,
              traffic, overtaking, opponent behavior, and uncertainty at the
              level needed for decision comparison. It deliberately avoids
              simulating full vehicle dynamics.
            </p>
            <div className="docs-list">
              <div>
                <b>Calibrate</b>
                <span>Fit against controlled F1 25 sessions.</span>
              </div>
              <div>
                <b>Hold out</b>
                <span>Validate on complete unseen laps and sessions.</span>
              </div>
              <div>
                <b>Randomize</b>
                <span>Stress traffic, pace, harvest, and model residuals.</span>
              </div>
              <div>
                <b>Replay</b>
                <span>
                  Reproduce every advisory decision deterministically.
                </span>
              </div>
            </div>
          </section>

          <section id="decision">
            <p className="docs-label">04 · Intelligence</p>
            <h2>Decision intelligence</h2>
            <p>
              At a strategic decision point, the planner evaluates conserve,
              hold, pressure, eligibility push, attack, and defend using common
              random samples. A learned critic contributes long-horizon value
              without becoming an unquestionable final decision maker.
            </p>
            <div className="docs-definition">
              <h3>Energy shadow price</h3>
              <p>
                The marginal future race value of one more unit of stored
                energy.
              </p>
              <code>λE ≈ [J(s,E+δ) − J(s,E−δ)] / 2δ</code>
            </div>
            <div className="docs-definition">
              <h3>Eligibility value</h3>
              <p>
                The downstream value created by crossing a tactical threshold.
              </p>
              <code>EV = ΔPelig × Velig − λEΔE</code>
            </div>
            <div className="docs-definition">
              <h3>Lower-tail risk</h3>
              <p>
                A CVaR-aware score that prevents mean upside from hiding bad
                futures.
              </p>
              <code>score = E[U] − κ(E[U] − CVaR10)</code>
            </div>
          </section>

          <section id="hardware">
            <p className="docs-label">05 · Physical proof</p>
            <h2>Hardware-in-the-loop</h2>
            <p>
              The same recommendation protocol drives an ESP32-S3 vehicle. A
              DRV8833 controls the motors and an INA219 measures voltage and
              current. Power is integrated over time to produce a real joule
              count.
            </p>
            <div className="docs-callout docs-callout-dark">
              <strong>Safety invariant</strong>
              <span>Stale network command → stop motors</span>
            </div>
            <p>
              The physical rig proves the end-to-end electrical control and
              measurement loop. It does not claim to reproduce an F1 powertrain.
            </p>
          </section>

          <section id="validation">
            <p className="docs-label">06 · Evidence</p>
            <h2>Validation gates</h2>
            <div className="validation-table">
              <div>
                <b>Unit</b>
                <span>Energy conservation and deterministic transitions</span>
              </div>
              <div>
                <b>Surrogate</b>
                <span>Held-out segment and energy prediction</span>
              </div>
              <div>
                <b>Strategic</b>
                <span>Paired trials against scripted baselines</span>
              </div>
              <div>
                <b>HIL</b>
                <span>Stable commands, traces, and safe fault behavior</span>
              </div>
            </div>
            <p>
              The full method is compared against equal allocation, greedy
              attack, scripted heuristic, planner-only, and learned-only
              baselines using matched scenarios and multiple random seeds.
            </p>
          </section>

          <div className="docs-next">
            <span>Next</span>
            <Link href="/faq">Read the frequently asked questions →</Link>
          </div>
        </article>
      </div>
      <SiteFooter />
    </main>
  );
}
