import { MONZA } from "./monza";
import type { CircuitDefinition } from "./types";

export type { CircuitDefinition, CircuitLandmark, HarvestZone } from "./types";

const CIRCUITS: Record<string, CircuitDefinition> = {
  monza: MONZA,
};

export function getCircuit(id: string): CircuitDefinition {
  const circuit = CIRCUITS[id];
  if (!circuit) {
    throw new Error(`Unknown circuit: ${id}`);
  }
  return circuit;
}

export { MONZA };
