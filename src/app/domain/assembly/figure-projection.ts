import { AssemblyPlan, Vec3 } from './assembly-plan';

export interface ProjectedFacet {
  readonly points: string;
  readonly fill: string;
}

const YAW = (35 * Math.PI) / 180;
const ELEVATION = (28 * Math.PI) / 180;
const BOX = 100;
const PADDING = 6;

interface Placed {
  readonly corners: readonly (readonly [number, number])[];
  readonly depth: number;
  readonly fill: string;
}

function project([x, y, z]: Vec3): { sx: number; sy: number; depth: number } {
  const across = x * Math.cos(YAW) - y * Math.sin(YAW);
  const away = x * Math.sin(YAW) + y * Math.cos(YAW);
  return {
    sx: across,
    sy: -(z * Math.cos(ELEVATION) + away * Math.sin(ELEVATION)),
    depth: away * Math.cos(ELEVATION) - z * Math.sin(ELEVATION),
  };
}

export function projectFigure(plan: AssemblyPlan): readonly ProjectedFacet[] {
  const placed = plan.pieces.flatMap((piece) =>
    piece.faces.map((face): Placed => {
      const corners = face.solid.map(project);
      return {
        corners: corners.map(({ sx, sy }) => [sx, sy] as const),
        depth: corners.reduce((sum, corner) => sum + corner.depth, 0) / corners.length,
        fill: face.colour,
      };
    })
  );
  const xs = placed.flatMap((facet) => facet.corners.map(([x]) => x));
  const ys = placed.flatMap((facet) => facet.corners.map(([, y]) => y));
  const [minX, minY] = [Math.min(...xs), Math.min(...ys)];
  const span = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY);
  const scale = (BOX - PADDING * 2) / span;
  const offsetX = (BOX - (Math.max(...xs) - minX) * scale) / 2;
  const offsetY = (BOX - (Math.max(...ys) - minY) * scale) / 2;
  return [...placed]
    .sort((a, b) => b.depth - a.depth)
    .map(({ corners, fill }) => ({
      points: corners
        .map(([x, y]) => `${round((x - minX) * scale + offsetX)},${round((y - minY) * scale + offsetY)}`)
        .join(' '),
      fill,
    }));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
