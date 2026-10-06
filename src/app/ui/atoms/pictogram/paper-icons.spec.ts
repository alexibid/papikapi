import { describe, expect, it } from 'vitest';
import { parsePoints } from './paper-icon';
import { PAPER_ICONS, PICTOGRAM_NAMES, isPictogramName } from './paper-icons';

const HEX_FILL = /^#[0-9A-F]{6}$/i;
const MIN_FACETS = 3;
const MIN_VERTICES = 3;

const vertices = parsePoints;

describe('the paper icon set', () => {
  it('is registered under every name it declares', () => {
    expect(PICTOGRAM_NAMES.length).toBe(Object.keys(PAPER_ICONS).length);
    expect(isPictogramName('mascot')).toBe(true);
    expect(isPictogramName('not-an-icon')).toBe(false);
  });

  it.each(PICTOGRAM_NAMES)('%s is built only from flat, filled polygons', (name) => {
    const { facets } = PAPER_ICONS[name];

    expect(facets.length).toBeGreaterThanOrEqual(MIN_FACETS);
    facets.forEach(([facetPoints, fill]) => {
      expect(fill).toMatch(HEX_FILL);
      expect(vertices(facetPoints).length).toBeGreaterThanOrEqual(MIN_VERTICES);
    });
  });

  it.each(PICTOGRAM_NAMES)('%s stays inside its own grid', (name) => {
    const { size, facets } = PAPER_ICONS[name];

    facets.forEach(([facetPoints]) =>
      vertices(facetPoints).forEach(([x, y]) => {
        expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(size);
        expect(y).toBeLessThanOrEqual(size);
      })
    );
  });

  it('names the icons the product needs', () => {
    const needed = ['toothbrush', 'bed', 'backpack', 'plate', 'check', 'hourglass', 'lock', 'sound',
      'mute', 'avatar', 'trophy', 'close', 'cube', 'play', 'backspace', 'mascot'];

    needed.forEach((name) => expect(isPictogramName(name)).toBe(true));
  });
});
