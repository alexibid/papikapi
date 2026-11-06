import { describe, expect, it } from 'vitest';
import { AssemblyPlan, Vec3 } from './assembly-plan';
import { projectFigure } from './figure-projection';

function plan(...faces: { solid: readonly Vec3[]; colour: string }[]): AssemblyPlan {
  return {
    pieces: [
      {
        number: 1,
        tray: [0, 0],
        size: [1, 1],
        progressStart: 0,
        progressEnd: 1,
        faces: faces.map((face, index) => ({
          id: index,
          parent: -1,
          depth: 0,
          polygon: [],
          ...face,
        })),
      },
    ],
  };
}

const square = (z: number): readonly Vec3[] => [
  [0, 0, z],
  [100, 0, z],
  [100, 100, z],
  [0, 100, z],
];

describe('projectFigure', () => {
  it('draws one facet per face, keeping its colour', () => {
    const facets = projectFigure(plan({ solid: square(0), colour: '#112233' }));

    expect(facets).toHaveLength(1);
    expect(facets[0].fill).toBe('#112233');
  });

  it('keeps every point inside the thumbnail box', () => {
    projectFigure(plan({ solid: square(0), colour: '#fff' }, { solid: square(80), colour: '#000' }))
      .flatMap((facet) => facet.points.split(' '))
      .forEach((pair) => {
        const [x, y] = pair.split(',').map(Number);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(100);
        expect(y).toBeLessThanOrEqual(100);
      });
  });

  it('paints the far faces first so the near ones stay on top', () => {
    const far: readonly Vec3[] = [[0, 90, 0], [10, 90, 0], [10, 100, 0], [0, 100, 0]];
    const near: readonly Vec3[] = [[0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0]];

    const facets = projectFigure(plan({ solid: near, colour: '#aaa' }, { solid: far, colour: '#bbb' }));

    expect(facets.map((facet) => facet.fill)).toEqual(['#bbb', '#aaa']);
  });

  it('supports figure id to project from calibrated 3/4 front angle', () => {
    const frontFace: readonly Vec3[] = [[-50, 0, 0], [-40, 0, 0], [-40, 10, 0]];
    const backFace: readonly Vec3[] = [[50, 0, 0], [60, 0, 0], [60, 10, 0]];
    const testPlan = plan({ solid: frontFace, colour: '#front' }, { solid: backFace, colour: '#back' });

    const defaultFacets = projectFigure(testPlan);
    const alignedFacets = projectFigure(testPlan, 'a2182a3u');

    expect(defaultFacets).toHaveLength(2);
    expect(alignedFacets).toHaveLength(2);
    // At default 35°, +X is closer; at 215° (180° rotation), -X is closer so paint order inverts
    expect(defaultFacets[0].fill).not.toEqual(alignedFacets[0].fill);
  });
});
