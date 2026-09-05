export type DataField = {
  label: string;
  description: string;
  section: string;
};

export const LAP_DATA_REFERENCE: DataField[] = [
  {
    section: "Header",
    label: "Circuit",
    description:
      "Race venue for this replay session. Drives the track vector, lap length, and corner labels on the boost map.",
  },
  {
    section: "Header",
    label: "Laps in session",
    description:
      "Total race distance loaded from the replay buffer (all 57 laps for this session).",
  },
  {
    section: "Header",
    label: "Projected position",
    description:
      "Finishing position if the VMAX predictive boost map is followed for the remaining stint (e.g. P7.2).",
  },
  {
    section: "Header",
    label: "Replay code",
    description:
      "Internal identifier for the stored telemetry replay used in this debrief (e.g. 004–023).",
  },
  {
    section: "Summary",
    label: "Laps in view",
    description:
      "Number of laps currently shown after filters, out of the full race. Sub-label breaks down how many laps VMAX won, instinct won, or were even.",
  },
  {
    section: "Summary",
    label: "VMAX advantage",
    description:
      "Total lap-time gain across the full race if VMAX's boost map had been followed instead of instinct. Negative means instinct was faster overall.",
  },
  {
    section: "Summary",
    label: "Boost accuracy",
    description:
      "Mean percentage overlap between instinct and VMAX boost windows across all laps in view. 100% = identical deployment timing and duration.",
  },
  {
    section: "Summary",
    label: "Mean timing error",
    description:
      "Average start-time difference between matched instinct and VMAX boost windows, in milliseconds. Spatial equivalent shown at 280 km/h boost speed (78 m/s).",
  },
  {
    section: "Lap list",
    label: "Lap number",
    description: "Race lap index from the replay.",
  },
  {
    section: "Lap list",
    label: "Position · opponent",
    description:
      "Track position at lap start and the nearest car ahead or behind used for strategic context.",
  },
  {
    section: "Lap list",
    label: "Scenario tag",
    description:
      "Special strategic context: eligibility (overtake unlock), defense (rear threat), or recovery (low energy reserve).",
  },
  {
    section: "Lap list",
    label: "Instinct vs VMAX lap time",
    description:
      "Actual lap time with instinctive boosting vs simulated lap time if the VMAX model map had been followed.",
  },
  {
    section: "Lap list",
    label: "Spark bars",
    description:
      "Mini deployment trace around the lap. Amber = instinct boost, cyan = VMAX boost, green = both active.",
  },
  {
    section: "Lap list",
    label: "Delta badge",
    description:
      "Lap-time difference (VMAX − instinct). Green = VMAX faster, amber = instinct faster, grey = within 40 ms (even).",
  },
  {
    section: "Selected lap",
    label: "Accuracy",
    description:
      "Window overlap for this lap: share of lap distance where both maps were boosting simultaneously, out of all distance where either map boosted.",
  },
  {
    section: "Selected lap",
    label: "Timing error",
    description:
      "Mean start-time offset between paired instinct and VMAX windows on this lap.",
  },
  {
    section: "Selected lap",
    label: "Spatial error",
    description:
      "Timing error converted to distance at 280 km/h (78 m/s). Shows how far off-target the instinctive boost start was.",
  },
  {
    section: "Selected lap",
    label: "Wasted / missed",
    description:
      "Wasted = % of lap distance instinct boosted but VMAX would not. Missed = % VMAX would boost but instinct did not.",
  },
  {
    section: "Boost map",
    label: "Instinct boost (amber)",
    description:
      "Where the driver actually deployed ERS/boost, scaled by deploy intensity (0–100%).",
  },
  {
    section: "Boost map",
    label: "VMAX boost (cyan)",
    description:
      "Where the predictive model recommends deployment for optimal lap time and energy reserve.",
  },
  {
    section: "Boost map",
    label: "Instinct-only / wasted (red)",
    description:
      "Boost segments the driver used that do not overlap any VMAX window — energy spent with no model support.",
  },
  {
    section: "Boost map",
    label: "Detection line (green tick)",
    description:
      "Track position where the overtake-eligibility sensor is crossed. Boost before this on attack laps may be illegal or low-value.",
  },
  {
    section: "Boost map",
    label: "Overtake zone",
    description:
      "Highlighted straight section where a pass is physically possible and strategically relevant.",
  },
  {
    section: "Boost map",
    label: "Playhead / distance",
    description:
      "Scrub position around the lap as a percentage and absolute distance (km) along the circuit.",
  },
  {
    section: "Boost map",
    label: "Instinct / VMAX action",
    description:
      "Boost action type at the playhead: Attack, Defend, Pressure, Hold, Eligibility push, or Coast/harvest.",
  },
  {
    section: "Boost map",
    label: "Model energy",
    description:
      "Simulated usable ERS reserve (%) at the playhead position following the VMAX map.",
  },
  {
    section: "Charts",
    label: "Boost deployment",
    description:
      "Deployment intensity (0–100%) around the lap for instinct (amber) vs VMAX (cyan).",
  },
  {
    section: "Charts",
    label: "Stored energy",
    description:
      "Simulated energy level through the lap. Harvest zones add energy; boost windows drain it.",
  },
  {
    section: "Boost windows",
    label: "Source",
    description: "Whether the window came from instinct (driver) or VMAX (model).",
  },
  {
    section: "Boost windows",
    label: "Zone",
    description: "Named track segment where the boost window occurs.",
  },
  {
    section: "Boost windows",
    label: "Lap %",
    description: "Start and end of the window as a percentage of lap distance.",
  },
  {
    section: "Boost windows",
    label: "Action",
    description:
      "Strategic intent: Attack (overtake), Defend (cover pass), Pressure (force error), Hold (conserve), Eligibility push (unlock overtake).",
  },
  {
    section: "Boost windows",
    label: "Deploy",
    description: "Deployment intensity as a percentage of maximum available boost.",
  },
  {
    section: "Boost windows",
    label: "Error vs other map",
    description:
      "How early or late this window started compared to the nearest matching window on the other map.",
  },
];

export const DATA_SECTIONS = [
  ...new Set(LAP_DATA_REFERENCE.map((field) => field.section)),
];
