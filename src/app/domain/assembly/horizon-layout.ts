import { AssemblyPlan, Vec2 } from './assembly-plan';

export interface Footprint {
  readonly center: Vec2;
  readonly radius: number;
}

export const HORIZON_WINDOW = 5;

export const HORIZON_SCALE = 0.35;

const CELL_MARGIN = 1.6;
const HORIZON_RADII = 5;

export function figureFootprint(plan: AssemblyPlan): Footprint {
  const corners = plan.pieces.flatMap((piece) =>
    piece.faces.flatMap((face) => face.solid.map(([x, y]) => [x, y] as const)),
  );
  const xs = corners.map(([x]) => x);
  const ys = corners.map(([, y]) => y);
  const [minX, maxX] = [Math.min(...xs), Math.max(...xs)];
  const [minY, maxY] = [Math.min(...ys), Math.max(...ys)];
  return {
    center: [(minX + maxX) / 2, (minY + maxY) / 2],
    radius: Math.hypot(maxX - minX, maxY - minY) / 2,
  };
}

export function horizonCell(sizes: readonly Vec2[]): number {
  const largest = Math.max(...sizes.map(([width, height]) => Math.max(width, height)));
  return largest * HORIZON_SCALE * CELL_MARGIN;
}

export function isOnHorizon(index: number, built: number): boolean {
  return index >= built && index < built + HORIZON_WINDOW;
}

export function horizonSlot(
  index: number,
  footprint: Footprint,
  cell: number,
  viewYaw: number,
): Vec2 {
  const behind: Vec2 = [-Math.sin(viewYaw), Math.cos(viewYaw)];
  const across: Vec2 = [Math.cos(viewYaw), Math.sin(viewYaw)];
  const slot = Math.max(0, index - 1) % HORIZON_WINDOW;
  const lateral = (slot - (HORIZON_WINDOW - 1) / 2) * cell;
  const depth = footprint.radius * HORIZON_RADII;
  return [
    footprint.center[0] + behind[0] * depth + across[0] * lateral,
    footprint.center[1] + behind[1] * depth + across[1] * lateral,
  ];
}
