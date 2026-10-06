import {
  arrangeShelves,
  chooseFigure,
  figurePoints,
  mountCurrent,
  queueAfter,
  startProgress,
} from './figure-cycle';

const catalogue = ['t-rex', 'fox', 'plane', 'bear', 'owl'];

describe('mountCurrent', () => {
  it('puts the finished figure on the shelf and starts the next one', () => {
    const next = mountCurrent(startProgress('t-rex'), 9, catalogue);

    expect(next.mountedIds).toEqual(['t-rex']);
    expect(next.currentId).toBe('fox');
    expect(next.baselinePoints).toBe(9);
    expect(next.seenPieces).toBe(1);
  });

  it('never mounts the same figure twice', () => {
    const once = mountCurrent(startProgress('t-rex'), 9, catalogue);

    expect(mountCurrent({ ...once, currentId: 't-rex' }, 20, catalogue)).toEqual({
      ...once,
      currentId: 't-rex',
    });
  });

  it('keeps the last figure when the catalogue runs out', () => {
    const last = mountCurrent(startProgress('owl'), 5, ['owl']);

    expect(last.currentId).toBe('owl');
    expect(last.mountedIds).toEqual(['owl']);
  });
});

describe('figurePoints', () => {
  it('counts only what was earned since the last figure was mounted', () => {
    expect(figurePoints(14, { ...startProgress('fox'), baselinePoints: 9 })).toBe(5);
  });

  it('never goes negative', () => {
    expect(figurePoints(2, { ...startProgress('fox'), baselinePoints: 9 })).toBe(0);
  });
});

describe('queueAfter', () => {
  it('skips figures already mounted or being built', () => {
    const progress = { ...startProgress('fox'), mountedIds: ['t-rex'] };

    expect(queueAfter(progress, catalogue)).toEqual(['plane', 'bear', 'owl']);
  });
});

describe('arrangeShelves', () => {
  it('lays out mounted, building and queued trophies in rows of three', () => {
    const progress = { ...startProgress('plane'), mountedIds: ['t-rex', 'fox'] };

    const shelves = arrangeShelves(progress, catalogue, 20, 40);

    expect(shelves.map((shelf) => shelf.trophies.map((trophy) => trophy.state))).toEqual([
      ['mounted', 'mounted', 'building'],
      ['queued', 'queued'],
    ]);
  });

  it('shows how far the current figure has come in a handful of pips', () => {
    const [shelf] = arrangeShelves(startProgress('t-rex'), catalogue, 20, 40);

    expect(shelf.trophies[0]).toMatchObject({ piecesBuilt: 2, piecesTotal: 4 });
  });
});

describe('chooseFigure', () => {
  it('switches to a figure that is still waiting, keeping what the child has seen', () => {
    const chosen = chooseFigure(startProgress('t-rex'), 'plane', catalogue, 6);

    expect(chosen.currentId).toBe('plane');
    expect(chosen.seenPieces).toBe(6);
  });

  it('keeps the figures already mounted out of the choice', () => {
    const progress = { ...startProgress('fox'), mountedIds: ['t-rex'] };

    expect(chooseFigure(progress, 't-rex', catalogue, 3)).toBe(progress);
  });

  it('ignores a figure that is not in the catalogue and the one already being built', () => {
    const progress = startProgress('t-rex');

    expect(chooseFigure(progress, 'dragon', catalogue, 3)).toBe(progress);
    expect(chooseFigure(progress, 't-rex', catalogue, 3)).toBe(progress);
  });
});
