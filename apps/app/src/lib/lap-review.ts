import { MONZA } from "@/lib/circuits";

export type BoostAction =
  "Attack" | "Eligibility push" | "Defend" | "Pressure" | "Hold";

export type BoostWindow = {
  startPct: number;
  endPct: number;
  deploy: number;
  zone: string;
  action: BoostAction;
};

export type LapVerdict = "vmax" | "instinct" | "even";

export type LapStatus = {
  lap: number;
  scenario?: "eligibility" | "defense" | "recovery";
  position: number;
  opponent: string;
  energyStart: number;
  lapTimeInstinctMs: number;
  lapTimeModelMs: number;
  instinct: BoostWindow[];
  model: BoostWindow[];
  note: string;
  accuracy: number;
  timingErrorMs: number;
  spatialErrorM: number;
  wastedBoostPct: number;
  missedBoostPct: number;
  deltaMs: number;
  verdict: LapVerdict;
};

export const CIRCUIT = MONZA;
export const CIRCUIT_LANDMARKS = MONZA.landmarks;
export const DETECTION_PCT = MONZA.detectionPct;
export const OVERTAKE_ZONE = MONZA.overtakeZone;
export const HARVEST_ZONES = MONZA.harvestZones;

export const SESSION = {
  circuit: CIRCUIT.name,
  event: CIRCUIT.event,
  code: "004–023",
  car: "V/JQ-01",
  source: "Replay buffer",
  totalLaps: CIRCUIT.totalLaps,
  projectedInstinct: "P8.1",
  projectedModel: "P7.2",
};

const SAMPLE_COUNT = 200;
const BOOST_SPEED_MPS = 78;
const MATCH_PCT = 8;

type RawLap = Omit<
  LapStatus,
  | "accuracy"
  | "timingErrorMs"
  | "spatialErrorM"
  | "wastedBoostPct"
  | "missedBoostPct"
  | "deltaMs"
  | "verdict"
>;

const rawLaps: RawLap[] = [
  {
    lap: 38,
    position: 8,
    opponent: "Alonso",
    energyStart: 58,
    lapTimeInstinctMs: 84412,
    lapTimeModelMs: 84228,
    instinct: [
      {
        startPct: 9,
        endPct: 17,
        deploy: 0.9,
        zone: "Rettifilo exit",
        action: "Attack",
      },
      {
        startPct: 86,
        endPct: 96,
        deploy: 0.8,
        zone: "Parabolica / pit straight",
        action: "Attack",
      },
    ],
    model: [
      {
        startPct: 89,
        endPct: 97,
        deploy: 0.85,
        zone: "Pit straight",
        action: "Attack",
      },
    ],
    note: "Instinct dumped a low-value boost out of Rettifilo. VMAX held that energy for the pit straight.",
  },
  {
    lap: 39,
    position: 8,
    opponent: "Alonso",
    energyStart: 51,
    lapTimeInstinctMs: 84690,
    lapTimeModelMs: 84370,
    instinct: [
      {
        startPct: 84,
        endPct: 96,
        deploy: 0.95,
        zone: "Parabolica / pit straight",
        action: "Attack",
      },
    ],
    model: [
      {
        startPct: 70,
        endPct: 76,
        deploy: 0.82,
        zone: "Detection approach",
        action: "Eligibility push",
      },
      {
        startPct: 88,
        endPct: 97,
        deploy: 0.9,
        zone: "Pit straight",
        action: "Attack",
      },
    ],
    note: "Instinct attacked without crossing detection. VMAX spent a little early so the later overtake was legal.",
  },
  {
    lap: 40,
    position: 8,
    opponent: "Alonso",
    energyStart: 47,
    lapTimeInstinctMs: 84305,
    lapTimeModelMs: 84218,
    instinct: [
      {
        startPct: 86,
        endPct: 96,
        deploy: 0.84,
        zone: "Pit straight",
        action: "Attack",
      },
    ],
    model: [
      {
        startPct: 88,
        endPct: 97,
        deploy: 0.86,
        zone: "Pit straight",
        action: "Attack",
      },
    ],
    note: "Same window, but instinct opened boost about 80 m early and paid a small harvest penalty into T1.",
  },
  {
    lap: 41,
    position: 8,
    opponent: "Alonso",
    energyStart: 44,
    lapTimeInstinctMs: 84188,
    lapTimeModelMs: 84172,
    instinct: [
      {
        startPct: 91,
        endPct: 96,
        deploy: 0.6,
        zone: "Pit straight",
        action: "Pressure",
      },
    ],
    model: [
      {
        startPct: 90,
        endPct: 96,
        deploy: 0.55,
        zone: "Pit straight",
        action: "Pressure",
      },
    ],
    note: "Quiet lap. Both maps held energy and only pressed at the end of the straight.",
  },
  {
    lap: 42,
    scenario: "eligibility",
    position: 8,
    opponent: "Alonso",
    energyStart: 43,
    lapTimeInstinctMs: 84540,
    lapTimeModelMs: 84296,
    instinct: [
      {
        startPct: 10,
        endPct: 16,
        deploy: 0.88,
        zone: "Rettifilo exit",
        action: "Attack",
      },
      {
        startPct: 82,
        endPct: 95,
        deploy: 0.92,
        zone: "Parabolica / pit straight",
        action: "Attack",
      },
    ],
    model: [
      {
        startPct: 69,
        endPct: 76,
        deploy: 0.82,
        zone: "Detection approach",
        action: "Eligibility push",
      },
      {
        startPct: 89,
        endPct: 97,
        deploy: 0.88,
        zone: "Pit straight",
        action: "Attack",
      },
    ],
    note: "Competition scenario. Instinct went greedy while Overtake was still locked. VMAX bought the detection threshold first.",
  },
  {
    lap: 43,
    position: 8,
    opponent: "Alonso",
    energyStart: 39,
    lapTimeInstinctMs: 84480,
    lapTimeModelMs: 84355,
    instinct: [
      {
        startPct: 85,
        endPct: 98,
        deploy: 0.95,
        zone: "Pit straight",
        action: "Defend",
      },
    ],
    model: [
      {
        startPct: 88,
        endPct: 93,
        deploy: 0.7,
        zone: "Pit straight",
        action: "Defend",
      },
    ],
    note: "Rear gap was never inside a pass window. Instinct over-defended; VMAX spent a short burst and saved the rest.",
  },
  {
    lap: 44,
    position: 8,
    opponent: "Alonso",
    energyStart: 36,
    lapTimeInstinctMs: 84210,
    lapTimeModelMs: 84168,
    instinct: [
      {
        startPct: 89,
        endPct: 96,
        deploy: 0.8,
        zone: "Pit straight",
        action: "Attack",
      },
    ],
    model: [
      {
        startPct: 88,
        endPct: 96,
        deploy: 0.82,
        zone: "Pit straight",
        action: "Attack",
      },
    ],
    note: "Clean instinctive read of the main-straight attack. Timing error is inside one car length.",
  },
  {
    lap: 45,
    position: 8,
    opponent: "Alonso",
    energyStart: 34,
    lapTimeInstinctMs: 84595,
    lapTimeModelMs: 84382,
    instinct: [
      {
        startPct: 43,
        endPct: 50,
        deploy: 0.75,
        zone: "Lesmo 2 exit",
        action: "Attack",
      },
      {
        startPct: 90,
        endPct: 98,
        deploy: 0.7,
        zone: "Pit straight",
        action: "Attack",
      },
    ],
    model: [
      {
        startPct: 66,
        endPct: 72,
        deploy: 0.65,
        zone: "Ascari exit",
        action: "Pressure",
      },
      {
        startPct: 88,
        endPct: 96,
        deploy: 0.85,
        zone: "Pit straight",
        action: "Attack",
      },
    ],
    note: "Instinct boosted a low-overtake Lesmo. VMAX harvested through Ascari, then spent on the straight.",
  },
  {
    lap: 46,
    position: 8,
    opponent: "Alonso",
    energyStart: 31,
    lapTimeInstinctMs: 84340,
    lapTimeModelMs: 84410,
    instinct: [
      {
        startPct: 87,
        endPct: 93,
        deploy: 0.86,
        zone: "Pit straight",
        action: "Defend",
      },
    ],
    model: [
      {
        startPct: 90,
        endPct: 95,
        deploy: 0.7,
        zone: "Pit straight",
        action: "Pressure",
      },
    ],
    note: "Rare instinct win. The rear threat arrived a beat earlier than the belief model, and the defensive send covered it.",
  },
  {
    lap: 47,
    position: 8,
    opponent: "Alonso",
    energyStart: 33,
    lapTimeInstinctMs: 84720,
    lapTimeModelMs: 84305,
    instinct: [
      {
        startPct: 94,
        endPct: 97,
        deploy: 0.45,
        zone: "Pit straight",
        action: "Hold",
      },
    ],
    model: [
      {
        startPct: 68,
        endPct: 76,
        deploy: 0.84,
        zone: "Detection approach",
        action: "Eligibility push",
      },
      {
        startPct: 87,
        endPct: 97,
        deploy: 0.92,
        zone: "Pit straight",
        action: "Attack",
      },
    ],
    note: "Biggest swing. Instinct conserved through the only lap Alonso was vulnerable at detection.",
  },
  {
    lap: 48,
    position: 7,
    opponent: "Alonso",
    energyStart: 29,
    lapTimeInstinctMs: 84155,
    lapTimeModelMs: 84140,
    instinct: [],
    model: [],
    note: "Both maps conserved. No boost, no error — the model and the driver agreed the joule was worth more later.",
  },
  {
    lap: 49,
    scenario: "defense",
    position: 6,
    opponent: "Russell",
    energyStart: 31,
    lapTimeInstinctMs: 84490,
    lapTimeModelMs: 84322,
    instinct: [
      {
        startPct: 80,
        endPct: 98,
        deploy: 0.95,
        zone: "Parabolica / pit straight",
        action: "Attack",
      },
    ],
    model: [
      {
        startPct: 86,
        endPct: 94,
        deploy: 0.86,
        zone: "Pit straight",
        action: "Defend",
      },
    ],
    note: "Rear-threat scenario. Instinct used attack power; VMAX defended only through the actual pass window.",
  },
  {
    lap: 50,
    position: 6,
    opponent: "Russell",
    energyStart: 24,
    lapTimeInstinctMs: 84318,
    lapTimeModelMs: 84240,
    instinct: [
      {
        startPct: 88,
        endPct: 96,
        deploy: 0.78,
        zone: "Pit straight",
        action: "Attack",
      },
    ],
    model: [
      {
        startPct: 89,
        endPct: 96,
        deploy: 0.8,
        zone: "Pit straight",
        action: "Attack",
      },
    ],
    note: "Driver and model converged on the same straight. Residual error is mostly intensity, not location.",
  },
  {
    lap: 51,
    scenario: "recovery",
    position: 7,
    opponent: "Leclerc",
    energyStart: 17,
    lapTimeInstinctMs: 84680,
    lapTimeModelMs: 84388,
    instinct: [
      {
        startPct: 84,
        endPct: 96,
        deploy: 0.9,
        zone: "Parabolica / pit straight",
        action: "Attack",
      },
    ],
    model: [
      {
        startPct: 94,
        endPct: 97,
        deploy: 0.4,
        zone: "Pit straight",
        action: "Hold",
      },
    ],
    note: "Low-energy stint. Instinct still attacked; VMAX protected the remaining reserve for the final laps.",
  },
];

function occupied(windows: BoostWindow[], pct: number) {
  return windows.some(
    (window) => pct >= window.startPct && pct < window.endPct,
  );
}

function overlapAccuracy(instinct: BoostWindow[], model: BoostWindow[]) {
  if (instinct.length === 0 && model.length === 0) return 100;
  let both = 0;
  let either = 0;
  for (let index = 0; index < SAMPLE_COUNT; index += 1) {
    const pct = (index / SAMPLE_COUNT) * 100;
    const driver = occupied(instinct, pct);
    const vmax = occupied(model, pct);
    if (driver && vmax) both += 1;
    if (driver || vmax) either += 1;
  }
  if (either === 0) return 100;
  return Math.round((both / either) * 100);
}

function meanTimingErrorMs(
  instinct: BoostWindow[],
  model: BoostWindow[],
  lapMs: number,
) {
  if (model.length === 0 || instinct.length === 0) return 0;
  const used = new Set<number>();
  const errors: number[] = [];
  for (const window of model) {
    let bestIndex = -1;
    let bestDistance = MATCH_PCT;
    instinct.forEach((candidate, index) => {
      if (used.has(index)) return;
      const distance = Math.abs(candidate.startPct - window.startPct);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    if (bestIndex >= 0) {
      used.add(bestIndex);
      errors.push((bestDistance / 100) * lapMs);
    }
  }
  if (errors.length === 0) return 0;
  return Math.round(
    errors.reduce((sum, value) => sum + value, 0) / errors.length,
  );
}

function occupancyDelta(instinct: BoostWindow[], model: BoostWindow[]) {
  let wasted = 0;
  let missed = 0;
  for (let index = 0; index < SAMPLE_COUNT; index += 1) {
    const pct = (index / SAMPLE_COUNT) * 100;
    const driver = occupied(instinct, pct);
    const vmax = occupied(model, pct);
    if (driver && !vmax) wasted += 1;
    if (vmax && !driver) missed += 1;
  }
  return {
    wastedBoostPct: Math.round((wasted / SAMPLE_COUNT) * 1000) / 10,
    missedBoostPct: Math.round((missed / SAMPLE_COUNT) * 1000) / 10,
  };
}

function verdictFor(deltaMs: number): LapVerdict {
  if (deltaMs <= -40) return "vmax";
  if (deltaMs >= 40) return "instinct";
  return "even";
}

const detailedLaps = new Map(
  rawLaps.map((lap) => [lap.lap, lap] as const),
);

function racePosition(lap: number) {
  if (lap <= 6) return 12;
  if (lap <= 14) return 11;
  if (lap <= 22) return 10;
  if (lap <= 37) return 9;
  if (lap <= 47) return 8;
  if (lap === 48) return 7;
  if (lap <= 50) return 6;
  return 7;
}

function opponentFor(position: number, lap: number) {
  const byPosition: Record<number, string[]> = {
    12: ["Stroll"],
    11: ["Gasly"],
    10: ["Ocon", "Sainz"],
    9: ["Sainz"],
    8: ["Alonso"],
    7: ["Leclerc", "Alonso"],
    6: ["Russell"],
  };
  const options = byPosition[position] ?? ["Norris"];
  return options[lap % options.length];
}

function energyForLap(lap: number) {
  if (lap === 26) return 14;
  if (lap === 27) return 74;
  if (lap > 27) return Math.max(12, Math.round(78 - (lap - 27) * 2.1));
  return Math.max(24, Math.round(90 - lap * 1.05));
}

function lapTimeBase(lap: number) {
  const pitPenalty = lap === 26 ? 22400 : lap === 27 ? 1800 : 0;
  const variation = ((lap * 73) % 520) - 260;
  return 84180 + variation + pitPenalty;
}

function straightAttack(deploy = 0.82): {
  instinct: BoostWindow[];
  model: BoostWindow[];
} {
  return {
    instinct: [
      {
        startPct: 86,
        endPct: 96,
        deploy,
        zone: "Pit straight",
        action: "Attack",
      },
    ],
    model: [
      {
        startPct: 88,
        endPct: 97,
        deploy: deploy + 0.02,
        zone: "Pit straight",
        action: "Attack",
      },
    ],
  };
}

function generateRawLap(lap: number): RawLap {
  const override = detailedLaps.get(lap);
  if (override) return override;

  const position = racePosition(lap);
  const opponent = opponentFor(position, lap);
  const energyStart = energyForLap(lap);
  const base = lapTimeBase(lap);
  const pattern = lap % 6;

  if (lap === 26) {
    return {
      lap,
      position,
      opponent,
      energyStart,
      lapTimeInstinctMs: base + 180,
      lapTimeModelMs: base - 40,
      instinct: [],
      model: [],
      note: "Pit entry lap. Both maps conserved boost while the car was in the lane.",
    };
  }

  if (lap === 27) {
    return {
      lap,
      position,
      opponent,
      energyStart,
      lapTimeInstinctMs: base + 220,
      lapTimeModelMs: base - 95,
      instinct: [
        {
          startPct: 88,
          endPct: 97,
          deploy: 0.92,
          zone: "Pit straight",
          action: "Attack",
        },
      ],
      model: [
        {
          startPct: 89,
          endPct: 96,
          deploy: 0.78,
          zone: "Pit straight",
          action: "Pressure",
        },
      ],
      note: "Out-lap attack. Instinct spent hard off pit road; VMAX kept enough for the run to Sainz.",
    };
  }

  if (pattern === 0) {
    const { instinct, model } = straightAttack(0.76 + (lap % 3) * 0.04);
    return {
      lap,
      position,
      opponent,
      energyStart,
      lapTimeInstinctMs: base + 140,
      lapTimeModelMs: base - 110,
      instinct,
      model,
      note: "Routine straight attack. Instinct opened slightly early; VMAX timed the same window tighter.",
    };
  }

  if (pattern === 1) {
    return {
      lap,
      position,
      opponent,
      energyStart,
      lapTimeInstinctMs: base + 35,
      lapTimeModelMs: base + 20,
      instinct: straightAttack(0.58).instinct,
      model: straightAttack(0.56).model,
      note: "Aligned lap. Instinct and VMAX agreed on a light straight press.",
    };
  }

  if (pattern === 2) {
    return {
      lap,
      position,
      opponent,
      energyStart,
      lapTimeInstinctMs: base + 10,
      lapTimeModelMs: base + 8,
      instinct: [],
      model: [],
      note: "Harvest lap. Both maps banked energy through Ascari and Parabolica.",
    };
  }

  if (pattern === 3) {
    return {
      lap,
      position,
      opponent,
      energyStart,
      lapTimeInstinctMs: base + 260,
      lapTimeModelMs: base - 85,
      instinct: [
        {
          startPct: 10,
          endPct: 16,
          deploy: 0.82,
          zone: "Rettifilo exit",
          action: "Attack",
        },
        ...straightAttack(0.88).instinct,
      ],
      model: [
        {
          startPct: 69,
          endPct: 76,
          deploy: 0.8,
          zone: "Detection approach",
          action: "Eligibility push",
        },
        ...straightAttack(0.86).model,
      ],
      note: "Greedy instinct lap. Extra boost before the straight cost more than it returned.",
    };
  }

  if (pattern === 4) {
    return {
      lap,
      position,
      opponent,
      energyStart,
      lapTimeInstinctMs: base - 55,
      lapTimeModelMs: base + 70,
      instinct: [
        {
          startPct: 87,
          endPct: 94,
          deploy: 0.84,
          zone: "Pit straight",
          action: "Defend",
        },
      ],
      model: [
        {
          startPct: 90,
          endPct: 95,
          deploy: 0.68,
          zone: "Pit straight",
          action: "Pressure",
        },
      ],
      note: "Instinct defensive read landed earlier than the model threat estimate.",
    };
  }

  return {
    lap,
    position,
    opponent,
    energyStart,
    lapTimeInstinctMs: base + 95,
    lapTimeModelMs: base - 130,
    instinct: straightAttack(0.9).instinct,
    model: [
      {
        startPct: 70,
        endPct: 76,
        deploy: 0.78,
        zone: "Detection approach",
        action: "Eligibility push",
      },
      ...straightAttack(0.84).model,
    ],
    note: "VMAX bought detection before the straight; instinct arrived one beat late.",
  };
}

function enrich(lap: RawLap): LapStatus {
  const deltaMs = lap.lapTimeModelMs - lap.lapTimeInstinctMs;
  const timingErrorMs = meanTimingErrorMs(
    lap.instinct,
    lap.model,
    lap.lapTimeModelMs,
  );
  return {
    ...lap,
    accuracy: overlapAccuracy(lap.instinct, lap.model),
    timingErrorMs,
    spatialErrorM: Math.round((timingErrorMs / 1000) * BOOST_SPEED_MPS),
    ...occupancyDelta(lap.instinct, lap.model),
    deltaMs,
    verdict: verdictFor(deltaMs),
  };
}

export const laps: LapStatus[] = Array.from(
  { length: SESSION.totalLaps },
  (_, index) => enrich(generateRawLap(index + 1)),
);

export function formatLapTime(ms: number) {
  const minutes = Math.floor(ms / 60000);
  const seconds = (ms % 60000) / 1000;
  return `${minutes}:${seconds.toFixed(3).padStart(6, "0")}`;
}

export function formatDelta(ms: number) {
  if (Math.abs(ms) < 5) return "0.000";
  const sign = ms > 0 ? "+" : "−";
  return `${sign}${(Math.abs(ms) / 1000).toFixed(3)}`;
}

export function formatError(ms: number) {
  if (ms <= 0) return "0 ms";
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
  return `${ms} ms`;
}

export function deploymentSeries(windows: BoostWindow[], samples = 48) {
  return Array.from({ length: samples }, (_, index) => {
    const pct = (index / (samples - 1)) * 100;
    const window = windows.find(
      (entry) => pct >= entry.startPct && pct < entry.endPct,
    );
    return window ? window.deploy : 0;
  });
}

export function energySeries(
  start: number,
  windows: BoostWindow[],
  harvestBias: number,
  samples = 48,
) {
  let energy = start;
  return Array.from({ length: samples }, (_, index) => {
    const pct = (index / (samples - 1)) * 100;
    const boosting = occupied(windows, pct);
    const harvesting = HARVEST_ZONES.some(
      (zone) => pct >= zone.startPct && pct < zone.endPct,
    );
    if (boosting) energy -= 1.28;
    else if (harvesting) energy += 0.62 * harvestBias;
    else energy += 0.06;
    energy = Math.min(100, Math.max(4, energy));
    return Number(energy.toFixed(2));
  });
}

export function nearestWindow(windows: BoostWindow[], startPct: number) {
  if (windows.length === 0) return null;
  return windows.reduce((best, candidate) =>
    Math.abs(candidate.startPct - startPct) < Math.abs(best.startPct - startPct)
      ? candidate
      : best,
  );
}

export function windowTimingErrorMs(
  window: BoostWindow,
  other: BoostWindow | null,
  lapMs: number,
) {
  if (!other) return null;
  return Math.round(((other.startPct - window.startPct) / 100) * lapMs);
}

export function seriesToPolyline(
  values: number[],
  width: number,
  height: number,
  max = 1,
) {
  if (values.length === 0) return "";
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - (value / max) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function summarizeSession(rows: LapStatus[] = laps) {
  const deltaMs = rows.reduce((sum, lap) => sum + lap.deltaMs, 0);
  const accuracy = Math.round(
    rows.reduce((sum, lap) => sum + lap.accuracy, 0) / rows.length,
  );
  const timingErrorMs = Math.round(
    rows.reduce((sum, lap) => sum + lap.timingErrorMs, 0) / rows.length,
  );
  const spatialErrorM = Math.round(
    rows.reduce((sum, lap) => sum + lap.spatialErrorM, 0) / rows.length,
  );
  const vmaxLaps = rows.filter((lap) => lap.verdict === "vmax").length;
  const instinctLaps = rows.filter((lap) => lap.verdict === "instinct").length;
  const evenLaps = rows.filter((lap) => lap.verdict === "even").length;
  return {
    laps: rows.length,
    deltaMs,
    accuracy,
    timingErrorMs,
    spatialErrorM,
    vmaxLaps,
    instinctLaps,
    evenLaps,
    advantageSeconds: Number((Math.abs(deltaMs) / 1000).toFixed(2)),
    modelAhead: deltaMs < 0,
  };
}

function zoneForPct(pct: number) {
  if (pct >= 84) return "Pit straight";
  if (pct >= 66 && pct < 78) return "Detection approach";
  if (pct >= 8 && pct < 18) return "Rettifilo exit";
  const harvest = HARVEST_ZONES.find(
    (zone) => pct >= zone.startPct && pct < zone.endPct,
  );
  return harvest?.label ?? "Track segment";
}

function aggregateWindows(
  rows: LapStatus[],
  source: "instinct" | "model",
  minShare = 0.12,
): BoostWindow[] {
  const samples = 200;
  const threshold = Math.max(1, Math.ceil(rows.length * minShare));
  const counts = new Array(samples).fill(0);
  const deploySums = new Array(samples).fill(0);

  for (const lap of rows) {
    const windows = source === "instinct" ? lap.instinct : lap.model;
    for (let index = 0; index < samples; index += 1) {
      const pct = (index / samples) * 100;
      const window = windows.find(
        (entry) => pct >= entry.startPct && pct < entry.endPct,
      );
      if (window) {
        counts[index] += 1;
        deploySums[index] += window.deploy;
      }
    }
  }

  const windows: BoostWindow[] = [];
  let start = -1;

  for (let index = 0; index <= samples; index += 1) {
    const active = index < samples && counts[index] >= threshold;
    if (active && start < 0) start = index;
    if (!active && start >= 0) {
      const sliceCounts = counts.slice(start, index);
      const avgDeploy =
        deploySums
          .slice(start, index)
          .reduce(
            (sum, value, offset) => sum + value / Math.max(1, sliceCounts[offset]),
            0,
          ) / sliceCounts.length;
      const startPct = (start / samples) * 100;
      windows.push({
        startPct,
        endPct: (index / samples) * 100,
        deploy: Number(Math.min(1, avgDeploy).toFixed(2)),
        zone: zoneForPct(startPct),
        action: startPct >= 80 ? "Attack" : "Pressure",
      });
      start = -1;
    }
  }

  return windows;
}

export function aggregateSessionWindows(rows: LapStatus[] = laps) {
  return {
    instinct: aggregateWindows(rows, "instinct"),
    model: aggregateWindows(rows, "model"),
  };
}

export function boostShareAt(
  rows: LapStatus[],
  pct: number,
  source: "instinct" | "model",
) {
  if (rows.length === 0) return 0;
  const count = rows.filter((lap) => {
    const windows = source === "instinct" ? lap.instinct : lap.model;
    return windows.some(
      (window) => pct >= window.startPct && pct < window.endPct,
    );
  }).length;
  return Math.round((count / rows.length) * 100);
}

export const sessionSummary = summarizeSession();
export const sessionWindows = aggregateSessionWindows();
