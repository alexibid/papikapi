import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FIGURE_YAW_DEG,
  figureProjectionYaw,
  figureStageYaw,
} from './figure-orientations';

describe('figure-orientations', () => {
  it('returns default yaw for undefined or unknown figures', () => {
    const defaultRad = (DEFAULT_FIGURE_YAW_DEG * Math.PI) / 180;
    expect(figureProjectionYaw()).toBeCloseTo(defaultRad);
    expect(figureProjectionYaw('unknown-creature')).toBeCloseTo(defaultRad);
  });

  it('resolves curated yaw in radians for known figures', () => {
    expect(figureProjectionYaw('a2182a3u')).toBeCloseTo((305 * Math.PI) / 180);
    expect(figureProjectionYaw('j26braly')).toBeCloseTo((305 * Math.PI) / 180);
    expect(figureProjectionYaw('sx8qdo3v')).toBeCloseTo((305 * Math.PI) / 180);
    expect(figureProjectionYaw('2ia2hryn')).toBeCloseTo((305 * Math.PI) / 180);
  });

  it('respects numeric yaw override directly', () => {
    expect(figureProjectionYaw(1.234)).toBe(1.234);
  });

  it('computes stage camera yaw aligned with figure heading', () => {
    const baseHome = Math.PI * 0.28;
    expect(figureStageYaw('504i5ivf', baseHome)).toBeCloseTo(baseHome);
    expect(figureStageYaw('figures/a2182a3u/assembly.json', baseHome)).toBeCloseTo(
      baseHome + ((305 - 35) * Math.PI) / 180
    );
    expect(figureStageYaw('models/j26braly/assembly.json', baseHome)).toBeCloseTo(
      baseHome + ((305 - 35) * Math.PI) / 180
    );
  });
});
