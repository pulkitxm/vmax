"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import dash from "@/components/dashboard.module.css";
import styles from "@/components/lap-review.module.css";
import {
  DATA_SECTIONS,
  LAP_DATA_REFERENCE,
} from "@/lib/lap-data-reference";
import {
  CIRCUIT,
  SESSION,
  type BoostWindow,
  type LapStatus,
  deploymentSeries,
  energySeries,
  formatDelta,
  formatError,
  formatLapTime,
  laps,
  nearestWindow,
  seriesToPolyline,
  sessionSummary,
  summarizeSession,
  windowTimingErrorMs,
} from "@/lib/lap-review";

type FilterKey = "all" | "vmax" | "instinct" | "error";
type MapMode = "overlay" | "split";

const INSTINCT = "#f4c35a";
const MODEL = "#39e7f2";

function sparkState(instinct: number, model: number) {
  if (instinct > 0.12 && model > 0.12) return "both";
  if (instinct > 0.12) return "instinct";
  if (model > 0.12) return "model";
  return "off";
}

function filterLaps(key: FilterKey) {
  if (key === "vmax") return laps.filter((lap) => lap.verdict === "vmax");
  if (key === "instinct")
    return laps.filter((lap) => lap.verdict === "instinct");
  if (key === "error") return laps.filter((lap) => lap.timingErrorMs >= 1500);
  return laps;
}

function boostAt(windows: BoostWindow[], pct: number) {
  return windows.find(
    (window) => pct >= window.startPct && pct < window.endPct,
  );
}

function advantageCopy(lap: LapStatus) {
  const gap = formatDelta(lap.deltaMs);
  if (lap.verdict === "even") {
    return `No meaningful lap-time gap. Instinct and VMAX used essentially the same boost map (${lap.accuracy}% overlap).`;
  }
  if (lap.verdict === "instinct") {
    return `Experience won this lap by ${gap.replace("+", "")}s. VMAX opened the defensive send ${formatError(lap.timingErrorMs)} later.`;
  }
  return `VMAX was ${gap.replace("−", "")}s faster. Instinct opened boost ${formatError(lap.timingErrorMs)} / ${lap.spatialErrorM} m off the model map, and spent ${lap.wastedBoostPct}% of the lap boosting where VMAX would not.`;
}

function sessionAdvantageCopy() {
  const summary = sessionSummary;
  if (!summary.modelAhead) {
    return `Across all ${SESSION.totalLaps} laps, instinctive boosting was ${summary.advantageSeconds.toFixed(2)}s faster than the VMAX map.`;
  }
  return `Across all ${SESSION.totalLaps} laps, following VMAX instead of instinct was worth ${summary.advantageSeconds.toFixed(2)}s and a projected ${SESSION.projectedInstinct} → ${SESSION.projectedModel} lift.`;
}

function verdictLabel(lap: LapStatus) {
  if (lap.verdict === "even") return "Even lap";
  return `${lap.verdict === "vmax" ? "VMAX" : "Instinct"} ${formatDelta(lap.deltaMs)}s`;
}

function LapStatusPanel({ lap }: { lap: LapStatus }) {
  const rows = [
    ...lap.instinct.map((window) => ({ source: "instinct" as const, window })),
    ...lap.model.map((window) => ({ source: "model" as const, window })),
  ].sort((a, b) => a.window.startPct - b.window.startPct);

  return (
    <div className={styles.lapStatus}>
      <div className={styles.lapStatusHead}>
        <span>Lap status</span>
        <strong className={styles.delta} data-verdict={lap.verdict}>
          {verdictLabel(lap)}
        </strong>
      </div>
      <p className={styles.lapStatusCopy}>{advantageCopy(lap)}</p>
      {rows.length === 0 ? (
        <p className={styles.lapStatusEmpty}>
          No boost deployed — both maps conserved for a later attack.
        </p>
      ) : (
        <div className={styles.lapStatusRows}>
          {rows.map(({ source, window }) => {
            const other = nearestWindow(
              source === "instinct" ? lap.model : lap.instinct,
              window.startPct,
            );
            const error = windowTimingErrorMs(
              window,
              other,
              lap.lapTimeModelMs,
            );
            const matched =
              other != null && Math.abs(other.startPct - window.startPct) < 8;
            return (
              <div
                className={styles.lapStatusRow}
                data-source={source}
                key={`${source}-${window.startPct}-${window.action}`}
              >
                <em>{source === "instinct" ? "Instinct" : "VMAX"}</em>
                <span>{window.zone}</span>
                <b>{window.action}</b>
                <span>{Math.round(window.deploy * 100)}%</span>
                <span>
                  {matched && error != null
                    ? Math.abs(error) < 40
                      ? "Aligned"
                      : `${formatError(Math.abs(error))} ${error > 0 ? "early" : "late"}`
                    : "Unmatched"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BoostStrokes({
  windows,
  color,
  width,
}: {
  windows: BoostWindow[];
  color: string;
  width: number;
}) {
  if (windows.length === 0) return null;
  return windows.map((window) => (
    <path
      className={styles.boostStroke}
      d={CIRCUIT.path}
      key={`${color}-${window.startPct}-${window.endPct}-${window.action}`}
      pathLength={100}
      stroke={color}
      strokeDasharray={`${window.endPct - window.startPct} ${100 - (window.endPct - window.startPct)}`}
      strokeDashoffset={-window.startPct}
      strokeLinecap="round"
      strokeWidth={width}
      style={{ opacity: 0.65 + window.deploy * 0.35 }}
    />
  ));
}

function CircuitMap({
  instinct,
  model,
  playhead,
  showInstinct,
  showModel,
}: {
  instinct: BoostWindow[];
  model: BoostWindow[];
  playhead: number;
  showInstinct: boolean;
  showModel: boolean;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const [point, setPoint] = useState({ x: 250, y: 250 });
  const boostWidth = CIRCUIT.trackStrokeWidth + 8;

  useEffect(() => {
    const node = pathRef.current;
    if (!node) return;
    const length = node.getTotalLength();
    const next = node.getPointAtLength((playhead / 100) * length);
    setPoint({ x: next.x, y: next.y });
  }, [playhead]);

  return (
    <div className={styles.circuitShell}>
      <svg
        aria-label={`${CIRCUIT.name} boost map`}
        className={styles.circuitSvg}
        role="img"
        viewBox={CIRCUIT.viewBox}
      >
        <g transform="rotate(90 250 250)">
          <path
            className={styles.trackOuter}
            d={CIRCUIT.path}
            strokeWidth={CIRCUIT.trackStrokeWidth}
          />
          <path
            className={styles.trackInner}
            d={CIRCUIT.path}
            strokeWidth={5}
          />
          <path
            className={styles.pathGuide}
            d={CIRCUIT.path}
            ref={pathRef}
            strokeWidth={CIRCUIT.trackStrokeWidth}
          />
          {showInstinct && (
            <BoostStrokes
              color={INSTINCT}
              width={boostWidth}
              windows={instinct}
            />
          )}
          {showModel && (
            <BoostStrokes
              color={MODEL}
              width={boostWidth - 2}
              windows={model}
            />
          )}
          <circle className={styles.playheadDot} cx={point.x} cy={point.y} r={5} />
        </g>
      </svg>
    </div>
  );
}

function TraceChart({
  instinct,
  model,
  playhead,
  max,
  label,
  unit,
}: {
  instinct: number[];
  model: number[];
  playhead: number;
  max: number;
  label: string;
  unit: string;
}) {
  const width = 640;
  const height = 148;
  const instinctLine = seriesToPolyline(instinct, width, height, max);
  const modelLine = seriesToPolyline(model, width, height, max);
  const instinctArea = `0,${height} ${instinctLine} ${width},${height}`;
  const modelArea = `0,${height} ${modelLine} ${width},${height}`;
  const cursorX = (playhead / 100) * width;

  return (
    <article className={`${dash.panel} ${styles.chartBody}`}>
      <div className={styles.chartHead}>
        <span>{label}</span>
        <span>{unit}</span>
      </div>
      <svg
        aria-label={label}
        className={styles.chartSvg}
        preserveAspectRatio="none"
        viewBox={`0 0 ${width} ${height}`}
      >
        <line
          className={styles.grid}
          x1="0"
          x2={width}
          y1={height * 0.25}
          y2={height * 0.25}
        />
        <line
          className={styles.grid}
          x1="0"
          x2={width}
          y1={height * 0.5}
          y2={height * 0.5}
        />
        <line
          className={styles.grid}
          x1="0"
          x2={width}
          y1={height * 0.75}
          y2={height * 0.75}
        />
        <polygon className={styles.instinctFill} points={instinctArea} />
        <polygon className={styles.modelFill} points={modelArea} />
        <polyline className={styles.instinctLine} points={instinctLine} />
        <polyline className={styles.modelLine} points={modelLine} />
        <line
          className={styles.cursor}
          x1={cursorX}
          x2={cursorX}
          y1="0"
          y2={height}
        />
      </svg>
    </article>
  );
}

function EventRows({ lap }: { lap: LapStatus }) {
  const rows = [
    ...lap.instinct.map((window) => ({ source: "instinct" as const, window })),
    ...lap.model.map((window) => ({ source: "model" as const, window })),
  ].sort((a, b) => a.window.startPct - b.window.startPct);

  if (rows.length === 0) {
    return <p className={styles.emptyEvents}>No boost windows on this lap.</p>;
  }

  return rows.map(({ source, window }) => {
    const other = nearestWindow(
      source === "instinct" ? lap.model : lap.instinct,
      window.startPct,
    );
    const error = windowTimingErrorMs(window, other, lap.lapTimeModelMs);
    const matched =
      other != null && Math.abs(other.startPct - window.startPct) < 8;
    return (
      <div
        className={styles.eventRow}
        data-source={source}
        key={`${source}-${window.startPct}-${window.action}`}
      >
        <em>{source === "instinct" ? "Instinct" : "VMAX"}</em>
        <span>{window.zone}</span>
        <span>
          {window.startPct.toFixed(0)}–{window.endPct.toFixed(0)}%
        </span>
        <b>{window.action}</b>
        <span>{Math.round(window.deploy * 100)}% deploy</span>
        <span>
          {matched && error != null
            ? Math.abs(error) < 40
              ? "Aligned"
              : `${formatError(Math.abs(error))} ${error > 0 ? "early" : "late"}`
            : "No matching window"}
        </span>
      </div>
    );
  });
}

function DataReference() {
  const [open, setOpen] = useState(false);

  return (
    <article className={`${dash.panel} ${styles.dataRef}`}>
      <button
        aria-expanded={open}
        className={styles.dataRefToggle}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span>07 / Data reference</span>
        <span>{open ? "Hide field guide" : "Show field guide"}</span>
      </button>
      {open && (
        <div className={styles.dataRefBody}>
          {DATA_SECTIONS.map((section) => (
            <section className={styles.dataRefSection} key={section}>
              <h3>{section}</h3>
              <dl>
                {LAP_DATA_REFERENCE.filter((field) => field.section === section).map(
                  (field) => (
                    <div className={styles.dataRefRow} key={field.label}>
                      <dt>{field.label}</dt>
                      <dd>{field.description}</dd>
                    </div>
                  ),
                )}
              </dl>
            </section>
          ))}
        </div>
      )}
    </article>
  );
}

export function LapReview() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [mode, setMode] = useState<MapMode>("overlay");
  const [playhead, setPlayhead] = useState(76);
  const [selectedLap, setSelectedLap] = useState(42);
  const visible = useMemo(() => filterLaps(filter), [filter]);
  const selected =
    visible.find((lap) => lap.lap === selectedLap) ?? visible[0] ?? laps[0];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const index = visible.findIndex((lap) => lap.lap === selected.lap);
      if (event.key === "ArrowRight" && index < visible.length - 1) {
        setSelectedLap(visible[index + 1].lap);
      }
      if (event.key === "ArrowLeft" && index > 0) {
        setSelectedLap(visible[index - 1].lap);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected.lap, visible]);

  const instinctDeploy = deploymentSeries(selected.instinct);
  const modelDeploy = deploymentSeries(selected.model);
  const instinctEnergy = energySeries(
    selected.energyStart,
    selected.instinct,
    0.72,
  );
  const modelEnergy = energySeries(selected.energyStart, selected.model, 1);
  const filteredSummary = summarizeSession(visible);
  const instinctNow = boostAt(selected.instinct, playhead);
  const modelNow = boostAt(selected.model, playhead);
  const energyNow = Math.round(
    energySeries(selected.energyStart, selected.model, 1, 101)[
      Math.round(playhead)
    ] ?? selected.energyStart,
  );

  return (
    <main className={`${dash.shell} ${styles.shell}`}>
      <header className={dash.topbar}>
        <div className={dash.brandGroup}>
          <Link className={dash.brand} href="/" aria-label="Vmax home">
            <span className={dash.brandMark} aria-hidden="true" />
            <span>VMAX</span>
          </Link>
          <span className={dash.product}>JouleIQ / Lap status</span>
        </div>
        <div className={dash.sessionStrip}>
          <span>{SESSION.circuit}</span>
          <span>
            {SESSION.totalLaps} laps
          </span>
          <strong>{SESSION.projectedModel}</strong>
        </div>
        <div className={dash.topActions}>
          <Link className={dash.exitLink} href="/dashboard">
            Decision room <span aria-hidden="true">↗</span>
          </Link>
          <Link className={dash.exitLink} href="/">
            Exit <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>

      <section className={`${dash.workspace} ${styles.workspace}`}>
        <div className={dash.pageIntro}>
          <div>
            <p>Race intelligence / Replay {SESSION.code}</p>
            <h1>Lap status</h1>
          </div>
          <div className={dash.feedControl}>
            <span>Boost debrief</span>
            <strong>
              {SESSION.circuit} · {SESSION.totalLaps} laps
            </strong>
          </div>
        </div>

        <div className={styles.filterRow} role="group" aria-label="Lap filters">
          {(
            [
              ["all", "All laps"],
              ["vmax", "VMAX ahead"],
              ["instinct", "Instinct ahead"],
              ["error", "High timing error"],
            ] as const
          ).map(([key, label]) => (
            <button
              aria-pressed={filter === key}
              key={key}
              onClick={() => setFilter(key)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.summaryGrid}>
          <article className={`${dash.panel} ${styles.summaryCard}`}>
            <span>Laps in view</span>
            <strong>
              {visible.length} / {SESSION.totalLaps}
            </strong>
            <em>
              {filteredSummary.vmaxLaps} VMAX · {filteredSummary.instinctLaps}{" "}
              instinct · {filteredSummary.evenLaps} even
            </em>
          </article>
          <article
            className={`${dash.panel} ${styles.summaryCard}`}
            data-tone="green"
          >
            <span>VMAX advantage</span>
            <strong>
              {filteredSummary.modelAhead ? "+" : "−"}
              {filteredSummary.advantageSeconds.toFixed(2)}s
            </strong>
            <em>
              {SESSION.projectedInstinct} instinct → {SESSION.projectedModel}{" "}
              model
            </em>
          </article>
          <article
            className={`${dash.panel} ${styles.summaryCard}`}
            data-tone="cyan"
          >
            <span>Boost accuracy</span>
            <strong>{filteredSummary.accuracy}%</strong>
            <em>Overlap of instinct windows with the VMAX map</em>
          </article>
          <article
            className={`${dash.panel} ${styles.summaryCard}`}
            data-tone="amber"
          >
            <span>Mean timing error</span>
            <strong>{formatError(filteredSummary.timingErrorMs)}</strong>
            <em>{filteredSummary.spatialErrorM} m at boost speed</em>
          </article>
        </div>

        <div className={styles.board}>
          <article className={`${dash.panel} ${styles.lapList}`}>
            <div className={dash.panelLabel}>
              <span>01 / All laps</span>
              <span>Instinct vs VMAX</span>
            </div>
            {visible.map((lap) => {
              const instinctSpark = deploymentSeries(lap.instinct, 24);
              const modelSpark = deploymentSeries(lap.model, 24);
              return (
                <button
                  aria-current={lap.lap === selected.lap ? "true" : undefined}
                  className={styles.lapRow}
                  data-selected={lap.lap === selected.lap}
                  key={lap.lap}
                  onClick={() => {
                    setSelectedLap(lap.lap);
                    setPlayhead(
                      lap.model[0]?.startPct ?? lap.instinct[0]?.startPct ?? 76,
                    );
                  }}
                  type="button"
                >
                  <b>{String(lap.lap).padStart(2, "0")}</b>
                  <span className={styles.lapCopy}>
                    <span>
                      P{lap.position} · {lap.opponent}
                      {lap.scenario ? ` · ${lap.scenario}` : ""}
                    </span>
                    <strong>
                      {formatLapTime(lap.lapTimeInstinctMs)} vs{" "}
                      {formatLapTime(lap.lapTimeModelMs)}
                    </strong>
                  </span>
                  <span className={styles.spark} aria-hidden="true">
                    {instinctSpark.map((value, index) => (
                      <i
                        data-on={sparkState(value, modelSpark[index] ?? 0)}
                        key={`${lap.lap}-${index}`}
                        style={{
                          height: `${12 + Math.max(value, modelSpark[index] ?? 0) * 18}px`,
                        }}
                      />
                    ))}
                  </span>
                  <span className={styles.delta} data-verdict={lap.verdict}>
                    {lap.verdict === "even"
                      ? "EVEN"
                      : `${formatDelta(lap.deltaMs)}s`}
                  </span>
                </button>
              );
            })}
          </article>

          <article className={dash.panel}>
            <div className={dash.panelLabel}>
              <span>02 / Selected lap</span>
              <span>
                Accuracy {selected.accuracy}% · Error{" "}
                {formatError(selected.timingErrorMs)}
              </span>
            </div>
            <div className={styles.detailHead}>
              <div>
                <p>
                  {selected.scenario
                    ? `${selected.scenario} scenario`
                    : "Replay lap"}
                </p>
                <h2>Lap {selected.lap}</h2>
              </div>
              <div className={styles.lapMeta}>
                <span>
                  Instinct {formatLapTime(selected.lapTimeInstinctMs)}
                </span>
                <span>VMAX {formatLapTime(selected.lapTimeModelMs)}</span>
                <strong
                  className={styles.delta}
                  data-verdict={selected.verdict}
                >
                  {selected.verdict === "even"
                    ? "Even"
                    : `${selected.verdict === "vmax" ? "VMAX" : "Instinct"} ${formatDelta(selected.deltaMs)}s`}
                </strong>
              </div>
            </div>
            <p className={styles.reason}>{selected.note}</p>
            <div className={styles.metricGrid}>
              <div>
                <span>Accuracy</span>
                <strong>{selected.accuracy}%</strong>
                <small>Window overlap</small>
              </div>
              <div>
                <span>Timing error</span>
                <strong>{formatError(selected.timingErrorMs)}</strong>
                <small>Mean start delta</small>
              </div>
              <div>
                <span>Spatial error</span>
                <strong>{selected.spatialErrorM} m</strong>
                <small>At 280 km/h</small>
              </div>
              <div>
                <span>Wasted / missed</span>
                <strong>
                  {selected.wastedBoostPct}% / {selected.missedBoostPct}%
                </strong>
                <small>Of lap distance</small>
              </div>
            </div>
            <LapStatusPanel lap={selected} />
          </article>
        </div>

        <article className={`${dash.panel} ${styles.comparePanel}`}>
          <div className={`${dash.panelLabel} ${styles.compareHead}`}>
            <span>03 / Comparative boost map</span>
            <div
              className={styles.compareToggle}
              role="group"
              aria-label="Map mode"
            >
              <button
                aria-pressed={mode === "overlay"}
                onClick={() => setMode("overlay")}
                type="button"
              >
                Overlay
              </button>
              <button
                aria-pressed={mode === "split"}
                onClick={() => setMode("split")}
                type="button"
              >
                Split
              </button>
            </div>
          </div>

          <div className={styles.maps} data-mode={mode}>
            {mode === "overlay" ? (
              <div className={styles.mapPane}>
                <div className={styles.mapLabel}>
                  <span>Instinct + VMAX · Lap {selected.lap}</span>
                  <b>{playhead.toFixed(0)}% lap distance</b>
                </div>
                <CircuitMap
                  instinct={selected.instinct}
                  model={selected.model}
                  playhead={playhead}
                  showInstinct
                  showModel
                />
              </div>
            ) : (
              <>
                <div className={styles.mapPane}>
                  <div className={styles.mapLabel}>
                    <span>Instinct · Lap {selected.lap}</span>
                    <b>{selected.instinct.length} windows</b>
                  </div>
                  <CircuitMap
                    instinct={selected.instinct}
                    model={[]}
                    playhead={playhead}
                    showInstinct
                    showModel={false}
                  />
                </div>
                <div className={styles.mapPane}>
                  <div className={styles.mapLabel}>
                    <span>VMAX · Lap {selected.lap}</span>
                    <b>{selected.model.length} windows</b>
                  </div>
                  <CircuitMap
                    instinct={[]}
                    model={selected.model}
                    playhead={playhead}
                    showInstinct={false}
                    showModel
                  />
                </div>
              </>
            )}
          </div>

          <div className={styles.legend}>
            <span>
              <i data-swatch="instinct" /> Instinct boost
            </span>
            <span>
              <i data-swatch="model" /> VMAX boost
            </span>
          </div>
          <p className={styles.circuitCredit}>
            Track layout · {CIRCUIT.layoutId} · julesr0y/f1-circuits-svg
          </p>

          <div className={styles.playhead}>
            <input
              aria-label="Lap distance playhead"
              max={100}
              min={0}
              onChange={(event) => setPlayhead(Number(event.target.value))}
              step={1}
              type="range"
              value={playhead}
            />
            <div className={styles.readout}>
              <div>
                Distance
                <strong>
                  {((playhead / 100) * CIRCUIT.lengthKm).toFixed(2)} km
                </strong>
              </div>
              <div>
                Instinct
                <strong data-on={Boolean(instinctNow)}>
                  {instinctNow
                    ? `${instinctNow.action} · ${instinctNow.zone}`
                    : "Coast / harvest"}
                </strong>
              </div>
              <div>
                VMAX
                <strong data-on={Boolean(modelNow)}>
                  {modelNow
                    ? `${modelNow.action} · ${modelNow.zone}`
                    : "Coast / harvest"}
                </strong>
              </div>
              <div>
                Model energy
                <strong>{energyNow}%</strong>
              </div>
            </div>
          </div>
        </article>

        <div className={styles.charts}>
          <TraceChart
            instinct={instinctDeploy}
            label="04 / Boost deployment"
            max={1}
            model={modelDeploy}
            playhead={playhead}
            unit="0–100% deploy"
          />
          <TraceChart
            instinct={instinctEnergy}
            label="05 / Stored energy"
            max={100}
            model={modelEnergy}
            playhead={playhead}
            unit="% usable"
          />
        </div>

        <article className={`${dash.panel} ${styles.events}`}>
          <div className={dash.panelLabel}>
            <span>06 / Boost windows</span>
            <span>
              {selected.instinct.length} instinct · {selected.model.length}{" "}
              model
            </span>
          </div>
          <div className={styles.eventHead}>
            <span>Source</span>
            <span>Zone</span>
            <span>Lap %</span>
            <span>Action</span>
            <span>Deploy</span>
            <span>Error vs other map</span>
          </div>
          <EventRows lap={selected} />
        </article>

        <DataReference />

        <footer className={dash.footer}>
          <span>{sessionAdvantageCopy()}</span>
          <span>
            Mock debrief · {SESSION.source} · Schema 1 · Arrow keys change lap
          </span>
        </footer>
      </section>
    </main>
  );
}

export function LapDebriefStrip() {
  const summary = sessionSummary;
  return (
    <article className={`${dash.panel} ${styles.debriefStrip}`}>
      <div>
        <div className={styles.debriefLabel}>09 / Session debrief</div>
        <p>
          Across all {SESSION.totalLaps} laps, VMAX is{" "}
          <strong>{summary.advantageSeconds.toFixed(2)}s</strong> ahead of
          instinctive boosting, with {summary.accuracy}% window overlap.
        </p>
      </div>
      <div className={styles.debriefStats}>
        <span>
          Accuracy
          <b>{summary.accuracy}%</b>
        </span>
        <span>
          Mean error
          <b>{formatError(summary.timingErrorMs)}</b>
        </span>
        <span>
          Projected
          <b>
            {SESSION.projectedInstinct} → {SESSION.projectedModel}
          </b>
        </span>
      </div>
      <Link className={styles.debriefLink} href="/laps">
        Inspect all laps <span aria-hidden="true">↗</span>
      </Link>
    </article>
  );
}
