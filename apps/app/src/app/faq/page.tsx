import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "Frequently Asked Questions",
  "Answers about Vmax, JouleIQ, F1 25 telemetry, reinforcement learning, energy strategy, risk, hardware validation, and project scope.",
  "/faq",
);

const faqs = [
  [
    "What is Vmax?",
    "Vmax is the team building JouleIQ, an energy-aware and overtake-aware race-intelligence system for the 2026 racing era.",
  ],
  [
    "What does JouleIQ actually recommend?",
    "It recommends one tactical mode: conserve, hold, pressure, eligibility push, attack, or defend. Each call includes projected energy cost, expected outcome, lower-tail risk, confidence, time-to-live, and a plain-language reason.",
  ],
  [
    "Does reinforcement learning drive the car?",
    "No. JouleIQ is human-facing decision support. A learned policy or critic contributes long-horizon value inside a constrained planner, while the final output is an engineer recommendation.",
  ],
  [
    "Why use F1 25?",
    "F1 25 provides a useful 2026 reference environment with live official UDP telemetry, overtake-mode behavior, active aerodynamics, traffic, weather, and race context. It calibrates and validates the fast strategic twin.",
  ],
  [
    "Why not train directly inside the game?",
    "Telemetry output is not a programmable training interface. It does not expose the rapid reset, state cloning, external step control, and counterfactual throughput required for millions of learning interactions.",
  ],
  [
    "What is energy shadow price?",
    "It is the estimated marginal future race value of stored energy in the current state. It makes a hold decision explainable by showing when a joule is projected to be more valuable later.",
  ],
  [
    "What is eligibility value?",
    "It measures the downstream value of crossing a tactical threshold. A small deployment may buy little immediate lap time but sharply increase the probability of unlocking a later overtake opportunity.",
  ],
  [
    "How does JouleIQ handle uncertainty?",
    "It maintains a belief over hidden opponent state, randomizes plausible futures, compares actions with matched random samples, and exposes lower-tail risk alongside the mean outcome.",
  ],
  [
    "What does the physical car prove?",
    "It proves that the same recommendation protocol can control a real electrical load and produce a measured energy trace in joules. It does not claim F1 powertrain fidelity.",
  ],
  [
    "How is performance validated?",
    "The system uses held-out telemetry, deterministic replay, paired strategy scenarios, multiple random seeds, baseline comparisons, ablations, latency measurements, and hardware fault tests.",
  ],
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  return (
    <main className="interior-shell faq-shell">
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="faq-hero">
        <p className="eyebrow">Frequently asked questions</p>
        <h1>Straight answers. No black-box claims.</h1>
        <p>
          The scope, the science, the simulation boundary, and what the hardware
          demonstration really proves.
        </p>
      </section>
      <section className="faq-list" aria-label="Frequently asked questions">
        {faqs.map(([question, answer], index) => (
          <details key={question} open={index === 0}>
            <summary>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{question}</strong>
              <i aria-hidden="true">+</i>
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </section>
      <section className="faq-cta">
        <p>Want the full technical path?</p>
        <Link className="button button-primary" href="/docs">
          Open documentation <span aria-hidden="true">→</span>
        </Link>
      </section>
      <SiteFooter />
    </main>
  );
}
