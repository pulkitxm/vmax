"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import styles from "@/components/dashboard.module.css";

type RiskMode = "robust" | "balanced" | "aggressive";
type SourceMode = "live" | "replay";

const frames = [
  { gap: 1.06, energy: 43.0, speed: 318, power: 3.22, runEnergy: 12.8 },
  { gap: 1.04, energy: 42.8, speed: 321, power: 3.29, runEnergy: 13.1 },
  { gap: 1.02, energy: 42.6, speed: 324, power: 3.34, runEnergy: 13.5 },
  { gap: 1.0, energy: 42.4, speed: 326, power: 3.41, runEnergy: 13.9 },
  { gap: 0.98, energy: 42.2, speed: 329, power: 3.48, runEnergy: 14.3 },
];

const riskProfiles: Record<
  RiskMode,
  {
    action: string;
    confidence: number;
    reason: string;
    cost: string;
    finish: string;
    tail: string;
    accent: string;
  }
> = {
  robust: {
    action: "Pressure",
    confidence: 82,
    reason:
      "Close the gap without exposing the final stint to the attack tail.",
    cost: "0.09 MJ",
    finish: "+0.24",
    tail: "−0.08",
    accent: "cyan",
  },
  balanced: {
    action: "Eligibility push",
    confidence: 87,
    reason:
      "Spend a little now to cross detection, then preserve energy for the higher-value attack window.",
    cost: "0.14 MJ",
    finish: "+0.31",
    tail: "−0.12",
    accent: "red",
  },
  aggressive: {
    action: "Attack",
    confidence: 73,
    reason:
      "Maximize immediate pass probability while accepting a wider adverse tail.",
    cost: "0.28 MJ",
    finish: "+0.39",
    tail: "−0.96",
    accent: "amber",
  },
};

const actions = [
  { name: "Conserve", finish: "P8.3", utility: 42, risk: "Low", cvar: "P8.6" },
  { name: "Hold", finish: "P8.0", utility: 53, risk: "Low", cvar: "P8.5" },
  { name: "Pressure", finish: "P7.6", utility: 68, risk: "Medium", cvar: "P8.1" },
  { name: "Eligibility push", finish: "P7.2", utility: 86, risk: "Medium", cvar: "P7.9" },
  { name: "Attack", finish: "P7.1", utility: 78, risk: "High", cvar: "P9.0" },
  { name: "Defend", finish: "P7.9", utility: 48, risk: "Medium", cvar: "P8.7" },
];

const trace = [31, 34, 32, 39, 42, 38, 48, 51, 49, 58, 62, 67, 63, 71, 76, 73, 82];

function Mark({ children }: { children: React.ReactNode }) {
  return <span className={styles.mark}>{children}</span>;
}

export function Dashboard() {
  const [risk, setRisk] = useState<RiskMode>("balanced");
  const [source, setSource] = useState<SourceMode>("live");
  const [running, setRunning] = useState(true);
  const [frameIndex, setFrameIndex] = useState(0);
  const [whatIf, setWhatIf] = useState(true);
  const profile = riskProfiles[risk];
  const frame = frames[frameIndex];

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frames.length);
    }, 1600);
    return () => window.clearInterval(timer);
  }, [running]);

  const time = useMemo(
    () => `14:${String(32 + frameIndex).padStart(2, "0")}.${frameIndex * 17}`,
    [frameIndex],
  );

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brandGroup}>
          <Link className={styles.brand} href="/" aria-label="Vmax home">
            <span className={styles.brandMark} aria-hidden="true" />
            <span>VMAX</span>
          </Link>
          <span className={styles.product}>JouleIQ / Decision room</span>
        </div>
        <div className={styles.sessionStrip}>
          <span>Monza</span>
          <span>Lap 42 / 57</span>
          <strong>P8</strong>
        </div>
        <div className={styles.topActions}>
          <button
            className={styles.sourceButton}
            data-source={source}
            onClick={() => setSource((current) => (current === "live" ? "replay" : "live"))}
            type="button"
          >
            <i /> {source}
          </button>
          <Link className={styles.exitLink} href="/">
            Exit
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>

      <section className={styles.workspace}>
        <div className={styles.pageIntro}>
          <div>
            <p>Race intelligence / Scenario 004</p>
            <h1>Decision room</h1>
          </div>
          <div className={styles.feedControl}>
            <span>Mock data flow</span>
            <strong>{time}</strong>
            <button
              aria-label={running ? "Pause mocked telemetry" : "Resume mocked telemetry"}
              aria-pressed={!running}
              onClick={() => setRunning((current) => !current)}
              type="button"
            >
              {running ? "Pause" : "Resume"}
            </button>
          </div>
        </div>

        <div className={styles.primaryGrid}>
          <article className={`${styles.panel} ${styles.callPanel}`} data-accent={profile.accent}>
            <div className={styles.panelLabel}>
              <span>01 / Recommendation</span>
              <span>TTL 1.8 s</span>
            </div>
            <div className={styles.callBody}>
              <div>
                <p className={styles.callKicker}>Make the call</p>
                <h2>{profile.action}</h2>
                <p className={styles.reason}>{profile.reason}</p>
              </div>
              <div className={styles.confidence}>
                <span>Confidence</span>
                <strong>{profile.confidence}<small>%</small></strong>
                <div><i style={{ width: `${profile.confidence}%` }} /></div>
              </div>
            </div>
            <div className={styles.callMetrics}>
              <div><span>Energy cost</span><strong>{profile.cost}</strong></div>
              <div><span>Expected Δ finish</span><strong>{profile.finish}</strong></div>
              <div><span>Worst 10% CVaR</span><strong>{profile.tail}</strong></div>
              <div><span>Decision source</span><strong>Twin + critic</strong></div>
            </div>
          </article>

          <article className={`${styles.panel} ${styles.statePanel}`}>
            <div className={styles.panelLabel}>
              <span>02 / Race state</span>
              <span className={styles.validState}>State valid</span>
            </div>
            <div className={styles.stateHero}>
              <div><span>Gap to Alonso</span><strong>{frame.gap.toFixed(2)}<small>s</small></strong><em>−0.08 last 4 s</em></div>
              <div><span>Stored energy</span><strong>{frame.energy.toFixed(1)}<small>%</small></strong><em>2.41 MJ usable</em></div>
            </div>
            <div className={styles.stateList}>
              <span>Speed <b>{frame.speed} km/h</b></span>
              <span>Detection <b>690 m</b></span>
              <span>Overtake <b>Locked</b></span>
              <span>Active aero <b>Available</b></span>
            </div>
          </article>
        </div>

        <article className={`${styles.panel} ${styles.ribbonPanel}`}>
          <div className={styles.panelLabel}>
            <span>03 / Decision ribbon</span>
            <span>Next 2.4 km</span>
          </div>
          <div className={styles.ribbonSummary}>
            <div><span>Energy value now</span><strong>1.3<small> ms / kJ</small></strong></div>
            <div><span>Next attack window</span><strong>4.8<small> ms / kJ</small></strong></div>
            <div><span>Future premium</span><strong className={styles.redText}>3.7×</strong></div>
          </div>
          <div className={styles.ribbon}>
            <div className={styles.ribbonTrack}>
              <i className={styles.ribbonProgress} />
              <Mark>Now</Mark>
              <Mark>Detection</Mark>
              <Mark>Overtake</Mark>
              <Mark>Harvest</Mark>
            </div>
            <div className={styles.ribbonNotes}>
              <span>Gap 1.06 s</span>
              <span>Eligibility threshold 1.00 s</span>
              <span>Spend remaining high-value energy</span>
              <span>Recover 0.21 MJ</span>
            </div>
          </div>
          <div className={styles.eligibility}>
            <div><span>Hold</span><strong>34%</strong><i><b style={{ width: "34%" }} /></i></div>
            <div><span>Eligibility push</span><strong>81%</strong><i><b style={{ width: "81%" }} /></i></div>
            <p><strong>+47 pts</strong> chance of unlocking Overtake Mode</p>
          </div>
        </article>

        <div className={styles.analysisGrid}>
          <article className={`${styles.panel} ${styles.actionsPanel}`}>
            <div className={styles.panelLabel}>
              <span>04 / Counterfactual actions</span>
              <button
                aria-pressed={whatIf}
                onClick={() => setWhatIf((current) => !current)}
                type="button"
              >
                {whatIf ? "Hide what-if" : "Run what-if"}
              </button>
            </div>
            <div className={styles.actionHeader}>
              <span>Action</span><span>Expected</span><span>Utility</span><span>Risk</span><span>Worst 10%</span>
            </div>
            <div className={styles.actionRows} data-visible={whatIf}>
              {actions.map((action) => {
                const selected = action.name.toLowerCase() === profile.action.toLowerCase();
                return (
                  <div className={styles.actionRow} data-selected={selected} key={action.name}>
                    <span>{action.name}{selected && <small>Selected</small>}</span>
                    <strong>{action.finish}</strong>
                    <i><b style={{ width: `${action.utility}%` }} /></i>
                    <em data-risk={action.risk.toLowerCase()}>{action.risk}</em>
                    <span>{action.cvar}</span>
                  </div>
                );
              })}
            </div>
          </article>

          <article className={`${styles.panel} ${styles.riskPanel}`}>
            <div className={styles.panelLabel}><span>05 / Risk posture</span><span>Engineer control</span></div>
            <p>Set how strongly the planner protects the adverse tail.</p>
            <div className={styles.riskButtons}>
              {(["robust", "balanced", "aggressive"] as RiskMode[]).map((mode) => (
                <button
                  aria-pressed={risk === mode}
                  key={mode}
                  onClick={() => setRisk(mode)}
                  type="button"
                >
                  <span>{mode}</span>
                  <small>κ {mode === "robust" ? "0.90" : mode === "balanced" ? "0.50" : "0.20"}</small>
                </button>
              ))}
            </div>
            <div className={styles.belief}>
              <div><span>Opponent energy belief</span><strong>Entropy 0.94</strong></div>
              <div className={styles.beliefBar}><i /><i /><i /></div>
              <div className={styles.beliefLabels}><span>Low 46%</span><span>Mid 42%</span><span>High 12%</span></div>
            </div>
          </article>
        </div>

        <article className={`${styles.panel} ${styles.hilPanel}`}>
          <div className={styles.panelLabel}>
            <span>06 / Physical HIL</span>
            <span className={styles.linked}>ESP32 linked</span>
          </div>
          <div className={styles.hilMode}>
            <span>Applied mode</span>
            <strong>{profile.action}</strong>
            <small>ACK #0412</small>
          </div>
          <div className={styles.hilMetrics}>
            <div><span>Voltage</span><strong>7.31 <small>V</small></strong></div>
            <div><span>Current</span><strong>0.44 <small>A</small></strong></div>
            <div><span>Power</span><strong>{frame.power.toFixed(2)} <small>W</small></strong></div>
            <div><span>Run energy</span><strong>{frame.runEnergy.toFixed(1)} <small>J</small></strong></div>
          </div>
          <div className={styles.trace} aria-label="Mocked physical power trace">
            {trace.map((value, index) => <i key={`${value}-${index}`} style={{ height: `${value}%` }} />)}
          </div>
        </article>

        <footer className={styles.footer}>
          <span>Mock interface / No live vehicle commands</span>
          <span>Schema 1 · Seq 18,392 · p95 146 ms</span>
        </footer>
      </section>
    </main>
  );
}
