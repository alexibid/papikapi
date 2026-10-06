export type Facet = readonly [points: string, fill: string];

export interface PaperIcon {
  readonly size: number;
  readonly facets: readonly Facet[];
}

export type Tone = '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';

export type Hue = 'blue' | 'red' | 'amber' | 'emerald' | 'violet' | 'teal' | 'sky' | 'slate';

export type TonedFacet = readonly [tone: Tone, points: string];

export type Point = readonly [x: number, y: number];

export const PAPER_RAMPS: Readonly<Record<Hue, Readonly<Record<Tone, string>>>> = {
  blue: { 100: '#DBEAFE', 200: '#BFDBFE', 300: '#93C5FD', 400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8', 800: '#1E40AF', 900: '#1E3A8A' },
  red: { 100: '#FEE2E2', 200: '#FECACA', 300: '#FCA5A5', 400: '#F87171', 500: '#EF4444', 600: '#DC2626', 700: '#B91C1C', 800: '#991B1B', 900: '#7F1D1D' },
  amber: { 100: '#FEF3C7', 200: '#FDE68A', 300: '#FCD34D', 400: '#FBBF24', 500: '#F59E0B', 600: '#D97706', 700: '#B45309', 800: '#92400E', 900: '#78350F' },
  emerald: { 100: '#D1FAE5', 200: '#A7F3D0', 300: '#6EE7B7', 400: '#34D399', 500: '#10B981', 600: '#059669', 700: '#047857', 800: '#065F46', 900: '#064E3B' },
  violet: { 100: '#EDE9FE', 200: '#DDD6FE', 300: '#C4B5FD', 400: '#A78BFA', 500: '#8B5CF6', 600: '#7C3AED', 700: '#6D28D9', 800: '#5B21B6', 900: '#4C1D95' },
  teal: { 100: '#CCFBF1', 200: '#99F6E4', 300: '#5EEAD4', 400: '#2DD4BF', 500: '#14B8A6', 600: '#0D9488', 700: '#0F766E', 800: '#115E59', 900: '#134E4A' },
  sky: { 100: '#E0F2FE', 200: '#BAE6FD', 300: '#7DD3FC', 400: '#38BDF8', 500: '#0EA5E9', 600: '#0284C7', 700: '#0369A1', 800: '#075985', 900: '#0C4A6E' },
  slate: { 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1', 400: '#94A3B8', 500: '#64748B', 600: '#475569', 700: '#334155', 800: '#1E293B', 900: '#0F172A' },
};

export const ICON_GRID = 1000;

export function icon(size: number, facets: readonly Facet[]): PaperIcon {
  return { size, facets };
}

export function faceted(hue: Hue, facets: readonly TonedFacet[]): PaperIcon {
  const ramp = PAPER_RAMPS[hue];
  return icon(
    ICON_GRID,
    facets.map(([tone, points]): Facet => [points, ramp[tone]])
  );
}

export function polar(centerX: number, centerY: number, radius: number, degrees: number): Point {
  const radians = (degrees * Math.PI) / 180;
  return [
    Math.round(centerX + radius * Math.cos(radians)),
    Math.round(centerY + radius * Math.sin(radians)),
  ];
}

export function points(...vertices: readonly Point[]): string {
  return vertices.map(([x, y]) => `${x},${y}`).join(' ');
}

export function ringSegment(
  center: Point,
  innerRadius: number,
  outerRadius: number,
  fromDegrees: number,
  toDegrees: number
): string {
  const [cx, cy] = center;
  return points(
    polar(cx, cy, outerRadius, fromDegrees),
    polar(cx, cy, outerRadius, toDegrees),
    polar(cx, cy, innerRadius, toDegrees),
    polar(cx, cy, innerRadius, fromDegrees)
  );
}

export function fan(center: Point, rim: readonly Point[]): readonly string[] {
  return rim.map((vertex, index) => points(center, vertex, rim[(index + 1) % rim.length]));
}

export function parsePoints(facetPoints: string): readonly Point[] {
  const numbers = facetPoints.trim().split(/[\s,]+/).map(Number);
  return Array.from({ length: Math.floor(numbers.length / 2) }, (_, index): Point => [
    numbers[index * 2],
    numbers[index * 2 + 1],
  ]);
}

export function place(source: PaperIcon, scale: number, dx: number, dy: number): readonly Facet[] {
  return source.facets.map(([vertices, fill]): Facet => [
    points(
      ...parsePoints(vertices).map(([x, y]): Point => [
        Math.round(x * scale + dx),
        Math.round(y * scale + dy),
      ])
    ),
    fill,
  ]);
}

export function rotate(facets: readonly Facet[], degrees: number, pivot: Point): readonly Facet[] {
  const radians = (degrees * Math.PI) / 180;
  const [px, py] = pivot;
  return facets.map(([vertices, fill]): Facet => [
    points(
      ...parsePoints(vertices).map(([x, y]): Point => {
        const dx = x - px;
        const dy = y - py;
        return [
          Math.round(px + dx * Math.cos(radians) - dy * Math.sin(radians)),
          Math.round(py + dx * Math.sin(radians) + dy * Math.cos(radians)),
        ];
      })
    ),
    fill,
  ]);
}
