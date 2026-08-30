"use client";

import { useEffect, useRef, useState } from "react";

const stages = [
  {
    number: "01",
    label: "Read the race",
    title: "Turn raw telemetry into one trusted state.",
    body: "JouleIQ assembles gap, stored energy, overtake status, track position, and uncertainty without pretending hidden opponent energy is known.",
  },
  {
    number: "02",
    label: "Simulate choices",
    title: "Give every valid action the same uncertain future.",
    body: "Conserve, hold, pressure, eligibility push, attack, and defend are compared across matched Monte Carlo futures in the fast digital twin.",
  },
  {
    number: "03",
    label: "Price the future",
    title: "Measure where the next joule matters most.",
    body: "Energy shadow price exposes opportunity cost. Eligibility value captures the nonlinear benefit of crossing a detection threshold.",
  },
  {
    number: "04",
    label: "Make the call",
    title: "Recommend one action with risk in full view.",
    body: "The selected action includes energy cost, expected gain, adverse-tail risk, confidence, a time-to-live, and one human-readable reason.",
  },
];

const actions = [
  ["CONSERVE", "P8.3", "low"],
  ["HOLD", "P8.0", "low"],
  ["PRESSURE", "P7.6", "med"],
  ["ELIG PUSH", "P7.2", "selected"],
  ["ATTACK", "P7.1", "high"],
];

export function DecisionStory() {
  const [active, setActive] = useState(0);
  const refs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible)
          setActive(Number((visible.target as HTMLElement).dataset.step));
      },
      { rootMargin: "-32% 0px -38%", threshold: [0.1, 0.4, 0.7] },
    );
    refs.current.forEach((element) => element && observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="decision-story" aria-labelledby="decision-story-title">
      <div className="decision-intro" data-reveal>
        <p className="eyebrow">One state. Six futures.</p>
        <h2 id="decision-story-title">Scroll through the decision loop.</h2>
      </div>
      <div className="decision-layout">
        <div className="decision-steps">
          {stages.map((stage, index) => (
            <article
              className={`decision-step${active === index ? " is-active" : ""}`}
              data-step={index}
              key={stage.number}
              ref={(element) => {
                refs.current[index] = element;
              }}
            >
              <span>{stage.number}</span>
              <p>{stage.label}</p>
              <h3>{stage.title}</h3>
              <div>{stage.body}</div>
            </article>
          ))}
        </div>
        <div className="decision-visual-wrap">
          <div className={`decision-visual stage-${active + 1}`}>
            <div className="decision-visual-head">
              <span>JOULEIQ · LAP 42 / 57</span>
              <span className="status-dot">LIVE</span>
            </div>
            <div className="race-state">
              <span>
                GAP FRONT <b>1.06 s</b>
              </span>
              <span>
                ENERGY <b>43%</b>
              </span>
              <span>
                OVERTAKE <b>LOCKED</b>
              </span>
            </div>
            <div className="action-stack">
              {actions.map(([name, result, risk], index) => (
                <div
                  className={risk === "selected" ? "action-selected" : ""}
                  key={name}
                  style={{ "--action-index": index } as React.CSSProperties}
                >
                  <span>{name}</span>
                  <i />
                  <b>{result}</b>
                  <small>{risk === "selected" ? "87%" : risk}</small>
                </div>
              ))}
            </div>
            <div className="shadow-price">
              <div>
                <span>Value per joule</span>
                <strong>3.7×</strong>
              </div>
              <div className="shadow-bars" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="final-call">
              <span>RECOMMENDATION</span>
              <strong>ELIGIBILITY PUSH</strong>
              <p>Spend 0.14 MJ now to unlock the higher-value attack window.</p>
            </div>
            <div className="visual-stage-number" aria-hidden="true">
              0{active + 1}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
