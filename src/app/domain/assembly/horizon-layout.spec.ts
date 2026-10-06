import { describe, expect, it } from 'vitest';
import { AssemblyPlan, Vec2 } from './assembly-plan';
import {
  HORIZON_SCALE,
  HORIZON_WINDOW,
  figureFootprint,
  horizonCell,
  horizonSlot,
  isOnHorizon,
} from './horizon-layout';

const footprint = { center: [10, 20] as Vec2, radius: 100 };

function distanceFromCenter(slot: Vec2): number {
  return Math.hypot(slot[0] - footprint.center[0], slot[1] - footprint.center[1]);
}

describe('isOnHorizon', () => {
  it('should show the next pieces and nothing already built', () => {
    expect(isOnHorizon(2, 3)).toBe(false);
    expect(isOnHorizon(3, 3)).toBe(true);
    expect(isOnHorizon(3 + HORIZON_WINDOW - 1, 3)).toBe(true);
  });

  it('should hide the pieces still far down the queue', () => {
    expect(isOnHorizon(3 + HORIZON_WINDOW, 3)).toBe(false);
  });
});

describe('horizonSlot', () => {
  it('should stand every slot beyond the figure', () => {
    for (let index = 1; index <= HORIZON_WINDOW; index += 1) {
      expect(distanceFromCenter(horizonSlot(index, footprint, 40, 0.9))).toBeGreaterThan(
        footprint.radius,
      );
    }
  });

  it('should keep the pieces on screen at the same time apart', () => {
    const slots = Array.from({ length: HORIZON_WINDOW }, (_, index) =>
      horizonSlot(index + 1, footprint, 40, 0),
    );
    const xs = slots.map(([x]) => x).sort((a, b) => a - b);

    xs.slice(1).forEach((x, index) => expect(x - xs[index]).toBeGreaterThanOrEqual(40));
  });

  it('should reuse a slot for the piece that follows after the window', () => {
    expect(horizonSlot(1, footprint, 40, 0)).toEqual(
      horizonSlot(1 + HORIZON_WINDOW, footprint, 40, 0),
    );
  });
});

describe('horizonCell', () => {
  it('should leave room for the largest piece', () => {
    expect(horizonCell([[40, 30], [90, 20]])).toBeGreaterThan(90 * HORIZON_SCALE);
  });
});

describe('figureFootprint', () => {
  it('should centre on the placed pieces', () => {
    const face = {
      id: 1,
      parent: -1,
      depth: 0,
      polygon: [] as Vec2[],
      solid: [
        [0, 0, 0],
        [100, 40, 0],
      ] as const,
      colour: '#fff',
    };
    const plan: AssemblyPlan = {
      pieces: [
        { number: 1, faces: [face], tray: [0, 0], size: [1, 1], progressStart: 0, progressEnd: 1 },
      ],
    };

    expect(figureFootprint(plan).center).toEqual([50, 20]);
  });
});
