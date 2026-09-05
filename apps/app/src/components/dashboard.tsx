"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import styles from "@/components/dashboard.module.css";
import { LapDebriefStrip } from "@/components/lap-review";

type RiskMode = "robust" | "balanced" | "aggressive";
type SourceMode = "live" | "replay";
type ScenarioKey = "eligibility" | "defense" | "recovery";
type FaultMode = "clear" | "telemetry" | "vehicle";
type DispatchStage =
  "idle" | "planner" | "shield" | "command" | "ack" | "blocked" | "offline";
type ActionName =
  "Conserve" | "Hold" | "Pressure" | "Eligibility push" | "Attack" | "Defend";

type Scenario = {
  code: string;
  label: string;
  lap: number;
  position: number;
  opponent: string;
  gap: number;
  gapRear: number;
  energy: number;
  speed: number;
  detection: number;
  overtake: string;
  activeAero: string;
  runEnergy: number;
};

type EventEntry = {
  id: number;
  time: string;
  kind: "state" | "decision" | "command" | "fault";
  message: string;
};

const presets: Record<ScenarioKey, Scenario> = {
  eligibility: {
    code: "004",
    label: "Detection threshold",
    lap: 42,
    position: 8,
    opponent: "Alonso",
    gap: 1.06,
    gapRear: 2.14,
    energy: 43,
    speed: 318,
    detection: 690,
    overtake: "Locked",
    activeAero: "Available",
    runEnergy: 12.8,
  },
  defense: {
    code: "017",
    label: "Rear threat",
    lap: 49,
    position: 6,
    opponent: "Russell",
    gap: 2.42,
    gapRear: 0.71,
    energy: 31,
    speed: 296,
    detection: 1410,
    overtake: "Available",
    activeAero: "Closed",
    runEnergy: 19.6,
  },
  recovery: {
    code: "023",
    label: "Low energy stint",
    lap: 51,
    position: 7,
    opponent: "Leclerc",
    gap: 1.84,
    gapRear: 1.28,
    energy: 17,
    speed: 274,
    detection: 1820,
    overtake: "Available",
    activeAero: "Available",
    runEnergy: 24.1,
  },
};

const actionCatalog: Record<
  ActionName,
  {
    baseUtility: number;
    finish: string;
    cvar: string;
    risk: "Low" | "Medium" | "High";
    cost: number;
    deployment: number;
    color: string;
  }
> = {
  Conserve: {
    baseUtility: 42,
    finish: "P8.3",
    cvar: "P8.6",
    risk: "Low",
    cost: -0.06,
    deployment: 0.4,
    color: "cyan",
  },
  Hold: {
    baseUtility: 53,
    finish: "P8.0",
    cvar: "P8.5",
    risk: "Low",
    cost: 0,
    deployment: 0.55,
    color: "cyan",
  },
  Pressure: {
    baseUtility: 68,
    finish: "P7.6",
    cvar: "P8.1",
    risk: "Medium",
    cost: 0.09,
    deployment: 0.7,
    color: "cyan",
  },
  "Eligibility push": {
    baseUtility: 86,
    finish: "P7.2",
    cvar: "P7.9",
    risk: "Medium",
    cost: 0.14,
    deployment: 0.82,
    color: "red",
  },
  Attack: {
    baseUtility: 78,
    finish: "P7.1",
    cvar: "P9.0",
    risk: "High",
    cost: 0.28,
    deployment: 0.95,
    color: "amber",
  },
  Defend: {
    baseUtility: 48,
    finish: "P7.9",
    cvar: "P8.7",
    risk: "Medium",
    cost: 0.19,
    deployment: 0.86,
    color: "red",
  },
};

const actionNames = Object.keys(actionCatalog) as ActionName[];
const trace = [
  31, 34, 32, 39, 42, 38, 48, 51, 49, 58, 62, 67, 63, 71, 76, 73, 82,
];

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function timeLabel() {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function utilityFor(
  action: ActionName,
  scenario: Scenario,
  risk: RiskMode,
  fault: FaultMode,
) {
  let utility = actionCatalog[action].baseUtility;
  if (scenario.energy < 24) {
    if (action === "Conserve") utility += 38;
    if (action === "Hold") utility += 16;
    if (action === "Eligibility push") utility -= 32;
    if (action === "Attack" || action === "Defend") utility -= 38;
  }
  if (scenario.gapRear < 0.9 && action === "Defend") utility += 43;
  if (scenario.gapRear < 0.9 && action === "Conserve") utility -= 26;
  if (scenario.gap <= 1.15 && scenario.detection < 900) {
    if (action === "Eligibility push") utility += 13;
    if (action === "Pressure") utility += 6;
  }
  if (scenario.gap > 1.5 && action === "Eligibility push") utility -= 24;
  if (risk === "robust" && actionCatalog[action].risk === "High") utility -= 24;
  if (risk === "aggressive" && action === "Attack") utility += 18;
  if (fault === "telemetry") utility = action === "Hold" ? 100 : 12;
  return clamp(Math.round(utility), 8, 100);
}

function recommendationReason(
  action: ActionName,
  scenario: Scenario,
  fault: FaultMode,
) {
  if (fault === "telemetry") {
    return "Telemetry is stale. Hold the baseline map until a valid race state returns.";
  }
  if (action === "Conserve") {
    return "Stored energy is below the attack reserve. Recover now and protect the final stint.";
  }
  if (action === "Defend") {
    return `The rear gap is ${scenario.gapRear.toFixed(2)} seconds. Spend enough energy to remove the immediate pass window.`;
  }
  if (action === "Eligibility push") {
    return "Spend a little now to cross detection, then preserve energy for the higher-value attack window.";
  }
  if (action === "Attack") {
    return "Maximize immediate pass probability while accepting a wider adverse tail.";
  }
  if (action === "Pressure") {
    return "Close the gap without exposing the final stint to the attack tail.";
  }
  return "Maintain the current energy map while the next strategic window develops.";
}

function Mark({ children }: { children: React.ReactNode }) {
  return <span className={styles.mark}>{children}</span>;
}

export function Dashboard() {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>("eligibility");
  const [scenario, setScenario] = useState<Scenario>(presets.eligibility);
  const [risk, setRisk] = useState<RiskMode>("balanced");
  const [source, setSource] = useState<SourceMode>("live");
  const [fault, setFault] = useState<FaultMode>("clear");
  const [running, setRunning] = useState(true);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [whatIf, setWhatIf] = useState(true);
  const [analysisRun, setAnalysisRun] = useState(512);
  const [isComputing, setIsComputing] = useState(false);
  const [inspectedAction, setInspectedAction] = useState<ActionName | null>(
    null,
  );
  const [manualAction, setManualAction] = useState<ActionName | null>(null);
  const [dispatchStage, setDispatchStage] = useState<DispatchStage>("idle");
  const [ackSequence, setAckSequence] = useState(412);
  const [runEnergy, setRunEnergy] = useState(scenario.runEnergy);
  const [toast, setToast] = useState<string | null>(null);
  const [events, setEvents] = useState<EventEntry[]>([
    {
      id: 1,
      time: "14:32:04",
      kind: "state",
      message: "Scenario 004 loaded from the replay buffer",
    },
    {
      id: 2,
      time: "14:32:05",
      kind: "decision",
      message: "512 matched futures evaluated",
    },
  ]);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }, []);

  const addEvent = useCallback((kind: EventEntry["kind"], message: string) => {
    setEvents((current) =>
      [{ id: Date.now(), time: timeLabel(), kind, message }, ...current].slice(
        0,
        9,
      ),
    );
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % 9);
    }, 1400 / playbackSpeed);
    return () => window.clearInterval(timer);
  }, [playbackSpeed, running]);

  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const actionResults = useMemo(
    () =>
      actionNames
        .map((name) => ({
          name,
          ...actionCatalog[name],
          utility: utilityFor(name, scenario, risk, fault),
        }))
        .sort((a, b) => b.utility - a.utility),
    [fault, risk, scenario],
  );

  const modelAction = actionResults[0].name;
  const selectedAction = manualAction ?? modelAction;
  const selectedResult =
    actionResults.find((action) => action.name === selectedAction) ??
    actionResults[0];
  const secondResult =
    actionResults.find((action) => action.name !== selectedAction) ??
    actionResults[1];
  const confidence = clamp(
    72 + Math.round((selectedResult.utility - secondResult.utility) * 1.4),
    61,
    96,
  );
  const frame = {
    gap: clamp(scenario.gap - frameIndex * 0.012, 0.48, 4.2),
    energy: clamp(
      scenario.energy - frameIndex * selectedResult.deployment * 0.12,
      0,
      100,
    ),
    speed: Math.round(
      scenario.speed + frameIndex * selectedResult.deployment * 1.35,
    ),
    power: 1.42 + selectedResult.deployment * 2.08 + frameIndex * 0.018,
  };
  const eligibilityHold = clamp(
    Math.round(
      34 + (1.06 - frame.gap) * 72 - (scenario.detection - 690) * 0.025,
    ),
    4,
    91,
  );
  const eligibilityPush = clamp(
    eligibilityHold + Math.round(36 + selectedResult.deployment * 14),
    8,
    98,
  );
  const shadowNow = scenario.energy < 24 ? 4.2 : 1.3;
  const shadowNext = scenario.gapRear < 0.9 ? 3.9 : 4.8;
  const premium = (shadowNext / shadowNow).toFixed(1);
  const time = `14:${String(32 + frameIndex).padStart(2, "0")}.${frameIndex * 17}`;

  const setPreset = (key: ScenarioKey) => {
    clearTimers();
    setIsComputing(false);
    const next = presets[key];
    setScenarioKey(key);
    setScenario(next);
    setFrameIndex(0);
    setRunEnergy(next.runEnergy);
    setManualAction(null);
    setDispatchStage("idle");
    setFault("clear");
    addEvent("state", `${next.label} scenario ${next.code} loaded`);
    setToast(`${next.label} loaded`);
  };

  const setScenarioValue = (
    field: "gap" | "energy" | "detection",
    value: number,
  ) => {
    clearTimers();
    setIsComputing(false);
    setScenario((current) => ({ ...current, [field]: value }));
    setManualAction(null);
    setDispatchStage("idle");
  };

  const changeFault = (next: FaultMode) => {
    clearTimers();
    setIsComputing(false);
    setFault(next);
    setDispatchStage("idle");
    setManualAction(null);
    const message =
      next === "clear"
        ? "All data links restored"
        : next === "telemetry"
          ? "F1 telemetry age exceeded the safety limit"
          : "ESP32 heartbeat lost";
    addEvent(next === "clear" ? "state" : "fault", message);
    setToast(message);
  };

  const recompute = () => {
    clearTimers();
    setIsComputing(true);
    setAnalysisRun((current) => current + 512);
    addEvent("decision", "Counterfactual planner started 512 matched futures");
    const timer = window.setTimeout(() => {
      setIsComputing(false);
      addEvent(
        "decision",
        `${modelAction} selected from the updated race state`,
      );
      setToast("Decision model updated");
    }, 720);
    timers.current.push(timer);
  };

  const dispatch = () => {
    clearTimers();
    setIsComputing(false);
    if (fault === "telemetry") {
      setDispatchStage("blocked");
      addEvent(
        "fault",
        "Race shield blocked dispatch because telemetry is stale",
      );
      setToast("Dispatch blocked by race shield");
      return;
    }
    setDispatchStage("planner");
    addEvent("command", `${selectedAction} dispatch requested`);
    const shieldTimer = window.setTimeout(() => {
      setDispatchStage("shield");
      addEvent("command", "Race and HIL safety checks passed");
    }, 420);
    const commandTimer = window.setTimeout(() => {
      if (fault === "vehicle") {
        setDispatchStage("offline");
        addEvent("fault", "Command timed out before ESP32 acknowledgment");
        setToast("Vehicle acknowledgment timed out");
        return;
      }
      setDispatchStage("command");
      addEvent(
        "command",
        `${Math.round(selectedResult.deployment * 100)}% deployment sent to ESP32`,
      );
    }, 860);
    const ackTimer = window.setTimeout(() => {
      if (fault === "vehicle") return;
      setDispatchStage("ack");
      setAckSequence((current) => current + 1);
      setRunEnergy((current) => current + selectedResult.deployment * 1.8);
      addEvent("command", `ESP32 acknowledged ${selectedAction}`);
      setToast("Vehicle command acknowledged");
    }, 1320);
    timers.current.push(shieldTimer, commandTimer, ackTimer);
  };

  const applyAction = (action: ActionName) => {
    setManualAction(action);
    setInspectedAction(null);
    setDispatchStage("idle");
    addEvent("decision", `${action} selected as an engineer override`);
    setToast(`${action} is now the active call`);
  };

  const reset = () => {
    setPreset("eligibility");
    setRisk("balanced");
    setSource("live");
    setRunning(true);
    setPlaybackSpeed(1);
    setWhatIf(true);
    setAnalysisRun(512);
    setEvents([
      {
        id: Date.now(),
        time: timeLabel(),
        kind: "state",
        message: "Dashboard reset to the competition scenario",
      },
    ]);
  };

  const inspected = inspectedAction
    ? actionResults.find((action) => action.name === inspectedAction)
    : null;
  const pipeline = ["planner", "shield", "command", "ack"] as const;
  const stageIndex = pipeline.indexOf(
    dispatchStage as (typeof pipeline)[number],
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
          <span>Lap {scenario.lap} / 57</span>
          <strong>P{scenario.position}</strong>
        </div>
        <div className={styles.topActions}>
          <button
            className={styles.sourceButton}
            data-source={source}
            onClick={() => {
              const next = source === "live" ? "replay" : "live";
              setSource(next);
              addEvent("state", `${next} telemetry source selected`);
            }}
            type="button"
          >
            <i /> {source}
          </button>
          <Link className={styles.exitLink} href="/laps">
            Lap status
          </Link>
          <Link className={styles.exitLink} href="/">
            Exit <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>

      <section className={styles.workspace}>
        <div className={styles.pageIntro}>
          <div>
            <p>Race intelligence / Scenario {scenario.code}</p>
            <h1>Decision room</h1>
          </div>
          <div className={styles.feedControl}>
            <span>Mock data flow</span>
            <strong>{time}</strong>
            <button
              aria-label={
                running ? "Pause mocked telemetry" : "Resume mocked telemetry"
              }
              aria-pressed={!running}
              onClick={() => setRunning((current) => !current)}
              type="button"
            >
              {running ? "Pause" : "Resume"}
            </button>
          </div>
        </div>

        <section
          className={`${styles.panel} ${styles.toolsPanel}`}
          aria-label="Pit wall tools"
        >
          <div className={styles.panelLabel}>
            <span>00 / Pit wall tools</span>
            <button onClick={reset} type="button">
              Reset dashboard
            </button>
          </div>
          <div className={styles.toolGrid}>
            <div className={styles.toolGroup}>
              <span>Scenario</span>
              <div className={styles.scenarioButtons}>
                {(Object.keys(presets) as ScenarioKey[]).map((key) => (
                  <button
                    aria-pressed={scenarioKey === key}
                    key={key}
                    onClick={() => setPreset(key)}
                    type="button"
                  >
                    <small>{presets[key].code}</small>
                    {presets[key].label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.toolGroup}>
              <span>Playback</span>
              <div className={styles.playbackControls}>
                <button
                  aria-label="Previous telemetry frame"
                  onClick={() =>
                    setFrameIndex((current) => Math.max(0, current - 1))
                  }
                  type="button"
                >
                  ‹
                </button>
                <button
                  onClick={() => setRunning((current) => !current)}
                  type="button"
                >
                  {running ? "Pause" : "Play"}
                </button>
                <button
                  aria-label="Next telemetry frame"
                  onClick={() =>
                    setFrameIndex((current) => Math.min(8, current + 1))
                  }
                  type="button"
                >
                  ›
                </button>
                <select
                  aria-label="Playback speed"
                  onChange={(event) =>
                    setPlaybackSpeed(Number(event.target.value))
                  }
                  value={playbackSpeed}
                >
                  <option value={0.5}>0.5×</option>
                  <option value={1}>1×</option>
                  <option value={2}>2×</option>
                </select>
              </div>
              <input
                aria-label="Telemetry timeline"
                max="8"
                min="0"
                onChange={(event) => setFrameIndex(Number(event.target.value))}
                type="range"
                value={frameIndex}
              />
            </div>
            <div className={styles.toolGroup}>
              <span>Failure injection</span>
              <div className={styles.faultButtons}>
                <button
                  aria-pressed={fault === "clear"}
                  onClick={() => changeFault("clear")}
                  type="button"
                >
                  All clear
                </button>
                <button
                  aria-pressed={fault === "telemetry"}
                  onClick={() => changeFault("telemetry")}
                  type="button"
                >
                  Stale telemetry
                </button>
                <button
                  aria-pressed={fault === "vehicle"}
                  onClick={() => changeFault("vehicle")}
                  type="button"
                >
                  Vehicle offline
                </button>
              </div>
            </div>
          </div>
          <div className={styles.tuningGrid}>
            <label>
              <span>
                Gap ahead <strong>{scenario.gap.toFixed(2)} s</strong>
              </span>
              <input
                max="2.5"
                min="0.5"
                onChange={(event) =>
                  setScenarioValue("gap", Number(event.target.value))
                }
                step="0.01"
                type="range"
                value={scenario.gap}
              />
            </label>
            <label>
              <span>
                Stored energy <strong>{scenario.energy.toFixed(0)}%</strong>
              </span>
              <input
                max="100"
                min="5"
                onChange={(event) =>
                  setScenarioValue("energy", Number(event.target.value))
                }
                step="1"
                type="range"
                value={scenario.energy}
              />
            </label>
            <label>
              <span>
                Detection distance <strong>{scenario.detection} m</strong>
              </span>
              <input
                max="2200"
                min="200"
                onChange={(event) =>
                  setScenarioValue("detection", Number(event.target.value))
                }
                step="10"
                type="range"
                value={scenario.detection}
              />
            </label>
          </div>
        </section>

        <div className={styles.primaryGrid}>
          <article
            className={`${styles.panel} ${styles.callPanel}`}
            data-accent={selectedResult.color}
          >
            <div className={styles.panelLabel}>
              <span>01 / Recommendation</span>
              <span>
                {manualAction ? "Engineer override" : "Model call"} · TTL 1.8 s
              </span>
            </div>
            <div className={styles.callBody}>
              <div>
                <p className={styles.callKicker}>
                  {fault === "telemetry" ? "Fallback active" : "Make the call"}
                </p>
                <h2>{selectedAction}</h2>
                <p className={styles.reason}>
                  {recommendationReason(selectedAction, scenario, fault)}
                </p>
                <div className={styles.callActions}>
                  <button
                    data-primary="true"
                    disabled={
                      dispatchStage === "planner" ||
                      dispatchStage === "shield" ||
                      dispatchStage === "command"
                    }
                    onClick={dispatch}
                    type="button"
                  >
                    {dispatchStage === "ack"
                      ? "Send again"
                      : dispatchStage === "blocked"
                        ? "Retry dispatch"
                        : "Send to vehicle"}
                  </button>
                  <button
                    onClick={() => setInspectedAction(selectedAction)}
                    type="button"
                  >
                    Inspect call
                  </button>
                  {manualAction && (
                    <button
                      onClick={() => {
                        setManualAction(null);
                        addEvent("decision", "Engineer override cleared");
                      }}
                      type="button"
                    >
                      Use model call
                    </button>
                  )}
                </div>
              </div>
              <div className={styles.confidence}>
                <span>Confidence</span>
                <strong>
                  {confidence}
                  <small>%</small>
                </strong>
                <div>
                  <i style={{ width: `${confidence}%` }} />
                </div>
              </div>
            </div>
            <div className={styles.callMetrics}>
              <div>
                <span>Energy cost</span>
                <strong>
                  {selectedResult.cost >= 0
                    ? selectedResult.cost.toFixed(2)
                    : `+${Math.abs(selectedResult.cost).toFixed(2)}`}{" "}
                  MJ
                </strong>
              </div>
              <div>
                <span>Expected finish</span>
                <strong>{selectedResult.finish}</strong>
              </div>
              <div>
                <span>Worst 10% CVaR</span>
                <strong>{selectedResult.cvar}</strong>
              </div>
              <div>
                <span>Planner run</span>
                <strong>{analysisRun.toLocaleString()} futures</strong>
              </div>
            </div>
          </article>

          <article className={`${styles.panel} ${styles.statePanel}`}>
            <div className={styles.panelLabel}>
              <span>02 / Race state</span>
              <span
                className={
                  fault === "telemetry"
                    ? styles.invalidState
                    : styles.validState
                }
              >
                {fault === "telemetry" ? "State stale" : "State valid"}
              </span>
            </div>
            <div className={styles.stateHero}>
              <div>
                <span>Gap to {scenario.opponent}</span>
                <strong>
                  {frame.gap.toFixed(2)}
                  <small>s</small>
                </strong>
                <em>
                  {scenario.gapRear < 0.9
                    ? `Rear gap ${scenario.gapRear.toFixed(2)} s`
                    : "−0.08 last 4 s"}
                </em>
              </div>
              <div>
                <span>Stored energy</span>
                <strong>
                  {frame.energy.toFixed(1)}
                  <small>%</small>
                </strong>
                <em>{(frame.energy * 0.056).toFixed(2)} MJ usable</em>
              </div>
            </div>
            <div className={styles.stateList}>
              <span>
                Speed <b>{frame.speed} km/h</b>
              </span>
              <span>
                Detection <b>{scenario.detection} m</b>
              </span>
              <span>
                Overtake <b>{scenario.overtake}</b>
              </span>
              <span>
                Active aero <b>{scenario.activeAero}</b>
              </span>
            </div>
          </article>
        </div>

        <article className={`${styles.panel} ${styles.ribbonPanel}`}>
          <div className={styles.panelLabel}>
            <span>03 / Decision ribbon</span>
            <span>Next 2.4 km</span>
          </div>
          <div className={styles.ribbonSummary}>
            <div>
              <span>Energy value now</span>
              <strong>
                {shadowNow.toFixed(1)}
                <small> ms / kJ</small>
              </strong>
            </div>
            <div>
              <span>Next attack window</span>
              <strong>
                {shadowNext.toFixed(1)}
                <small> ms / kJ</small>
              </strong>
            </div>
            <div>
              <span>Future premium</span>
              <strong className={styles.redText}>{premium}×</strong>
            </div>
          </div>
          <div className={styles.ribbon}>
            <div className={styles.ribbonTrack}>
              <i
                className={styles.ribbonProgress}
                style={{ width: `${27 + frameIndex * 4}%` }}
              />
              <Mark>Now</Mark>
              <Mark>Detection</Mark>
              <Mark>Overtake</Mark>
              <Mark>Harvest</Mark>
            </div>
            <div className={styles.ribbonNotes}>
              <span>Gap {frame.gap.toFixed(2)} s</span>
              <span>Eligibility threshold 1.00 s</span>
              <span>Spend remaining high-value energy</span>
              <span>Recover 0.21 MJ</span>
            </div>
          </div>
          <div className={styles.eligibility}>
            <div>
              <span>Hold</span>
              <strong>{eligibilityHold}%</strong>
              <i>
                <b style={{ width: `${eligibilityHold}%` }} />
              </i>
            </div>
            <div>
              <span>Eligibility push</span>
              <strong>{eligibilityPush}%</strong>
              <i>
                <b style={{ width: `${eligibilityPush}%` }} />
              </i>
            </div>
            <p>
              <strong>+{eligibilityPush - eligibilityHold} pts</strong> chance
              of unlocking Overtake Mode
            </p>
          </div>
        </article>

        <div className={styles.analysisGrid}>
          <article className={`${styles.panel} ${styles.actionsPanel}`}>
            <div className={styles.panelLabel}>
              <span>04 / Counterfactual actions</span>
              <div className={styles.analysisTools}>
                <button
                  aria-pressed={whatIf}
                  onClick={() => setWhatIf((current) => !current)}
                  type="button"
                >
                  {whatIf ? "Hide" : "Show"}
                </button>
                <button
                  disabled={isComputing}
                  onClick={recompute}
                  type="button"
                >
                  {isComputing ? "Running 512 futures" : "Recompute"}
                </button>
              </div>
            </div>
            <div className={styles.actionHeader}>
              <span>Action</span>
              <span>Expected</span>
              <span>Utility</span>
              <span>Risk</span>
              <span>Worst 10%</span>
            </div>
            <div
              className={styles.actionRows}
              data-computing={isComputing}
              data-visible={whatIf}
            >
              {actionResults.map((action) => {
                const selected = action.name === selectedAction;
                return (
                  <button
                    className={styles.actionRow}
                    data-selected={selected}
                    key={action.name}
                    onClick={() => setInspectedAction(action.name)}
                    type="button"
                  >
                    <span>
                      {action.name}
                      {selected && <small>Selected</small>}
                    </span>
                    <strong>{action.finish}</strong>
                    <i>
                      <b style={{ width: `${action.utility}%` }} />
                    </i>
                    <em data-risk={action.risk.toLowerCase()}>{action.risk}</em>
                    <span>{action.cvar}</span>
                  </button>
                );
              })}
            </div>
          </article>

          <article className={`${styles.panel} ${styles.riskPanel}`}>
            <div className={styles.panelLabel}>
              <span>05 / Risk posture</span>
              <span>Engineer control</span>
            </div>
            <p>Set how strongly the planner protects the adverse tail.</p>
            <div className={styles.riskButtons}>
              {(["robust", "balanced", "aggressive"] as RiskMode[]).map(
                (mode) => (
                  <button
                    aria-pressed={risk === mode}
                    key={mode}
                    onClick={() => {
                      setRisk(mode);
                      setManualAction(null);
                      addEvent("decision", `${mode} risk posture selected`);
                    }}
                    type="button"
                  >
                    <span>{mode}</span>
                    <small>
                      κ{" "}
                      {mode === "robust"
                        ? "0.90"
                        : mode === "balanced"
                          ? "0.50"
                          : "0.20"}
                    </small>
                  </button>
                ),
              )}
            </div>
            <div className={styles.belief}>
              <div>
                <span>Opponent energy belief</span>
                <strong>Entropy 0.94</strong>
              </div>
              <div className={styles.beliefBar}>
                <i />
                <i />
                <i />
              </div>
              <div className={styles.beliefLabels}>
                <span>Low 46%</span>
                <span>Mid 42%</span>
                <span>High 12%</span>
              </div>
            </div>
          </article>
        </div>

        <article
          className={`${styles.panel} ${styles.hilPanel}`}
          data-stage={dispatchStage}
        >
          <div className={styles.panelLabel}>
            <span>06 / Physical HIL</span>
            <span
              className={
                fault === "vehicle" ? styles.invalidState : styles.linked
              }
            >
              {fault === "vehicle"
                ? "ESP32 offline"
                : dispatchStage === "ack"
                  ? "Command acknowledged"
                  : "ESP32 linked"}
            </span>
          </div>
          <div className={styles.hilMode}>
            <span>Applied mode</span>
            <strong>
              {dispatchStage === "ack"
                ? selectedAction
                : dispatchStage === "offline"
                  ? "Safe stop"
                  : "Hold"}
            </strong>
            <small>
              {dispatchStage === "ack"
                ? `ACK #${ackSequence}`
                : dispatchStage === "offline"
                  ? "ACK timeout"
                  : "Awaiting dispatch"}
            </small>
          </div>
          <div className={styles.hilMetrics}>
            <div>
              <span>Voltage</span>
              <strong>
                7.31 <small>V</small>
              </strong>
            </div>
            <div>
              <span>Current</span>
              <strong>
                {(0.16 + selectedResult.deployment * 0.3).toFixed(2)}{" "}
                <small>A</small>
              </strong>
            </div>
            <div>
              <span>Power</span>
              <strong>
                {frame.power.toFixed(2)} <small>W</small>
              </strong>
            </div>
            <div>
              <span>Run energy</span>
              <strong>
                {runEnergy.toFixed(1)} <small>J</small>
              </strong>
            </div>
          </div>
          <div
            className={styles.trace}
            aria-label="Mocked physical power trace"
          >
            {trace.map((value, index) => (
              <i
                key={`${value}-${index}`}
                style={{
                  height: `${clamp(value * selectedResult.deployment * 1.15, 12, 96)}%`,
                }}
              />
            ))}
          </div>
        </article>

        <div className={styles.operationsGrid}>
          <article className={`${styles.panel} ${styles.pipelinePanel}`}>
            <div className={styles.panelLabel}>
              <span>07 / Command pipeline</span>
              <span>End-to-end mock</span>
            </div>
            <div className={styles.pipeline}>
              {pipeline.map((stage, index) => {
                const state =
                  dispatchStage === "blocked" || dispatchStage === "offline"
                    ? index <= Math.max(stageIndex, 1)
                      ? "failed"
                      : "waiting"
                    : index < stageIndex
                      ? "complete"
                      : index === stageIndex
                        ? "active"
                        : "waiting";
                return (
                  <div data-state={state} key={stage}>
                    <i>{state === "complete" ? "✓" : index + 1}</i>
                    <span>
                      {stage === "planner"
                        ? "Recommendation"
                        : stage === "shield"
                          ? "Safety shield"
                          : stage === "command"
                            ? "Vehicle command"
                            : "ESP32 ACK"}
                    </span>
                    <small>{state}</small>
                  </div>
                );
              })}
            </div>
            <p className={styles.pipelineMessage} data-stage={dispatchStage}>
              {dispatchStage === "idle" &&
                "Send the current call to exercise the full command path."}
              {dispatchStage === "planner" &&
                "Freezing the selected recommendation and sequence number."}
              {dispatchStage === "shield" &&
                "Validating state age, energy reserve, TTL, and device limits."}
              {dispatchStage === "command" &&
                "Command sent. Waiting for the hardware acknowledgment."}
              {dispatchStage === "ack" &&
                "Vehicle acknowledged the mode and returned fresh power telemetry."}
              {dispatchStage === "blocked" &&
                "Dispatch stopped before the hardware path because the race state is stale."}
              {dispatchStage === "offline" &&
                "The TTL expired without an acknowledgment. The vehicle entered safe stop."}
            </p>
          </article>
          <article className={`${styles.panel} ${styles.eventPanel}`}>
            <div className={styles.panelLabel}>
              <span>08 / Event log</span>
              <button onClick={() => setEvents([])} type="button">
                Clear
              </button>
            </div>
            <div className={styles.eventList}>
              {events.length === 0 && (
                <p>No events yet. Change a scenario or send a command.</p>
              )}
              {events.map((event) => (
                <div data-kind={event.kind} key={event.id}>
                  <time>{event.time}</time>
                  <i />
                  <span>{event.message}</span>
                </div>
              ))}
            </div>
          </article>
        </div>

        <LapDebriefStrip />

        <footer className={styles.footer}>
          <span>Mock interface / No live vehicle commands</span>
          <span>Schema 1 · Seq 18,392 · p95 146 ms</span>
        </footer>
      </section>

      {inspected && (
        <div
          className={styles.drawerBackdrop}
          onClick={() => setInspectedAction(null)}
        >
          <aside
            aria-labelledby="action-drawer-title"
            aria-modal="true"
            className={styles.actionDrawer}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className={styles.drawerHeader}>
              <div>
                <span>Counterfactual inspection</span>
                <h2 id="action-drawer-title">{inspected.name}</h2>
              </div>
              <button
                aria-label="Close action inspection"
                onClick={() => setInspectedAction(null)}
                type="button"
              >
                ×
              </button>
            </div>
            <p>{recommendationReason(inspected.name, scenario, fault)}</p>
            <div className={styles.drawerMetrics}>
              <div>
                <span>Utility</span>
                <strong>{inspected.utility}</strong>
              </div>
              <div>
                <span>Expected</span>
                <strong>{inspected.finish}</strong>
              </div>
              <div>
                <span>Worst 10%</span>
                <strong>{inspected.cvar}</strong>
              </div>
            </div>
            <div className={styles.distribution}>
              <span>512 simulated finish outcomes</span>
              {[28, 56, 82, 69, 37].map((value, index) => (
                <div key={value}>
                  <small>P{index + 6}</small>
                  <i>
                    <b
                      style={{
                        width: `${clamp(value + inspected.utility * 0.12, 12, 96)}%`,
                      }}
                    />
                  </i>
                  <strong>
                    {Math.round((value + inspected.utility) / 3.8)}%
                  </strong>
                </div>
              ))}
            </div>
            <div className={styles.drawerFacts}>
              <span>
                Deployment <b>{Math.round(inspected.deployment * 100)}%</b>
              </span>
              <span>
                Energy delta <b>{inspected.cost.toFixed(2)} MJ</b>
              </span>
              <span>
                Tail risk <b>{inspected.risk}</b>
              </span>
              <span>
                Eligibility{" "}
                <b>
                  {inspected.name === "Eligibility push"
                    ? `${eligibilityPush}%`
                    : `${eligibilityHold}%`}
                </b>
              </span>
            </div>
            <div className={styles.drawerActions}>
              <button
                data-primary="true"
                onClick={() => applyAction(inspected.name)}
                type="button"
              >
                Use this action
              </button>
              <button onClick={() => setInspectedAction(null)} type="button">
                Close
              </button>
            </div>
          </aside>
        </div>
      )}

      {toast && (
        <div aria-live="polite" className={styles.toast}>
          <i />
          {toast}
        </div>
      )}
    </main>
  );
}
