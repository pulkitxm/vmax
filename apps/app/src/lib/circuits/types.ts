export type CircuitLandmark = {
  pct: number;
  label: string;
  /** Label offset from track centerline in SVG units */
  dx?: number;
  dy?: number;
};

export type HarvestZone = {
  startPct: number;
  endPct: number;
  label: string;
};

export type CircuitDefinition = {
  id: string;
  layoutId: string;
  name: string;
  event: string;
  lengthKm: number;
  totalLaps: number;
  viewBox: string;
  /** Path from the official circuit SVG asset — used for boost overlays only */
  path: string;
  /** Public URL to the circuit SVG file */
  svg: string;
  /** Native track stroke width from the SVG asset */
  trackStrokeWidth: number;
  landmarks: readonly CircuitLandmark[];
  detectionPct: number;
  overtakeZone: { startPct: number; endPct: number; label: string };
  harvestZones: readonly HarvestZone[];
};
