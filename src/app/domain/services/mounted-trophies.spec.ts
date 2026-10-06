import { startProgress, arrangeShelves } from '@domain/services/figure-cycle';
import { countMounted } from './mounted-trophies';

describe('countMounted', () => {
  it('counts only the trophies already on the shelf', () => {
    const progress = { ...startProgress('plane'), mountedIds: ['t-rex', 'fox'] };
    const shelves = arrangeShelves(progress, ['t-rex', 'fox', 'plane', 'bear', 'owl'], 5, 10);

    expect(countMounted(shelves)).toEqual({ mounted: 2, total: 5 });
  });

  it('rests at zero when there are no shelves', () => {
    expect(countMounted([])).toEqual({ mounted: 0, total: 0 });
  });
});
