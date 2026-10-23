import {
  allocatePoint,
  arrangeShelves,
  chooseFigure,
  consolidatePoints,
  figurePoints,
  mountCurrent,
  queueAfter,
  reclaimPoint,
  removeFigureFromShelf,
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
  it('shows only the active figure on the shelf at the beginning with no unchosen 0-point queued figures', () => {
    const progress = startProgress('t-rex');
    const shelves = arrangeShelves(progress, catalogue, 0, 40);
    expect(shelves.length).toBe(1);
    expect(shelves[0].trophies.map((t) => t.figureId)).toEqual(['t-rex']);
  });

  it('lays out mounted, building and queued trophies in rows of three', () => {
    const progress = {
      ...startProgress('plane'),
      mountedIds: ['t-rex', 'fox'],
      shelfIds: ['plane', 'bear', 'owl'],
    };

    const shelves = arrangeShelves(progress, catalogue, 20, 40);

    expect(shelves.map((shelf) => shelf.trophies.map((trophy) => trophy.state))).toEqual([
      ['mounted', 'mounted', 'building'],
      ['queued', 'queued'],
    ]);
  });

  it('allows removing figures from the shelf when their points are 0 via removeFigureFromShelf', () => {
    const progress = { ...startProgress('t-rex'), shelfIds: ['t-rex', 'fox'] };
    const [shelfBefore] = arrangeShelves(progress, catalogue, 5, 40);
    expect(shelfBefore.trophies.map((t) => t.figureId)).toContain('fox');

    const progressWithoutFox = removeFigureFromShelf(progress, 'fox');
    expect(progressWithoutFox.hiddenShelfIds).toContain('fox');
    const [shelfAfter] = arrangeShelves(progressWithoutFox, catalogue, 5, 40);
    expect(shelfAfter.trophies.map((t) => t.figureId)).not.toContain('fox');
  });

  it('prevents removing the active figure or figures with points from the shelf', () => {
    const progress = { ...startProgress('t-rex'), allocations: { 't-rex': 5, fox: 1 } };
    expect(removeFigureFromShelf(progress, 't-rex')).toBe(progress);
    expect(removeFigureFromShelf(progress, 'fox')).toBe(progress);
  });

  it('shows how far the current figure has come with exact pieces and total', () => {
    const [shelf] = arrangeShelves(startProgress('t-rex'), catalogue, 20, 40);

    expect(shelf.trophies[0]).toMatchObject({ piecesBuilt: 20, piecesTotal: 40 });
  });

  it('maintains stable shelf positions when choosing different figures', () => {
    const initialProgress = { ...startProgress('t-rex'), allocations: { 't-rex': 10, 'fox': 5, 'plane': 3 } };
    const [initialShelf] = arrangeShelves(initialProgress, catalogue, 10, 40);
    expect(initialShelf.trophies.map((t) => t.figureId)).toEqual(['t-rex', 'fox', 'plane']);

    const switchedProgress = chooseFigure(initialProgress, 'plane', catalogue);
    const [switchedShelf] = arrangeShelves(switchedProgress, catalogue, 5, 40);
    expect(switchedShelf.trophies.map((t) => t.figureId)).toEqual(['t-rex', 'fox', 'plane']);
    expect(switchedShelf.trophies[0].isChosen).toBe(false);
    expect(switchedShelf.trophies[2].isChosen).toBe(true);
  });

  it('keeps each figure own piecesTotal on the shelf when switching to a figure with fewer pieces', () => {
    const customCatalogue = ['ankylosaurus', 'pug', 'brachiosaurus'];
    const progress = {
      ...startProgress('brachiosaurus'),
      mountedIds: ['ankylosaurus'],
      shelfIds: ['ankylosaurus', 'pug', 'brachiosaurus'],
      allocations: { ankylosaurus: 60, pug: 50, brachiosaurus: 0 },
    };

    const [shelf] = arrangeShelves(progress, customCatalogue, 1, 20);
    const [anky, pug, brach] = shelf.trophies;

    expect(anky.piecesTotal).toBe(60);
    expect(anky.piecesBuilt).toBe(60);

    expect(pug.piecesTotal).toBe(36);
    expect(pug.piecesBuilt).toBe(26);
    expect(pug.state).toBe('building');

    expect(brach.piecesTotal).toBe(20);
    expect(brach.piecesBuilt).toBe(0);
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

describe('consolidatePoints', () => {
  it('converts raw points by a factor of 10 into consolidated points and tracks consolidating progress', () => {
    expect(consolidatePoints(0)).toEqual({ consolidated: 0, consolidating: 0, ratio: 0 });
    expect(consolidatePoints(5)).toEqual({ consolidated: 0, consolidating: 5, ratio: 0.5 });
    expect(consolidatePoints(10)).toEqual({ consolidated: 1, consolidating: 0, ratio: 0 });
    expect(consolidatePoints(27)).toEqual({ consolidated: 2, consolidating: 7, ratio: 0.7 });
    expect(consolidatePoints(100)).toEqual({ consolidated: 10, consolidating: 0, ratio: 0 });
    expect(consolidatePoints(270)).toEqual({ consolidated: 27, consolidating: 0, ratio: 0 });
  });
});

describe('allocatePoint & reclaimPoint on all figures', () => {
  it('allocates credit to the target figure when credit is available', () => {
    const progress = {
      ...startProgress('t-rex'),
      unassignedCredit: 2,
      allocations: { 't-rex': 1 },
    };
    const next = allocatePoint(progress, 't-rex');
    expect(next.unassignedCredit).toBe(1);
    expect(next.allocations?.['t-rex']).toBe(2);
  });

  it('does not allocate points when credit is 0', () => {
    const progress = {
      ...startProgress('t-rex'),
      unassignedCredit: 0,
      allocations: { 't-rex': 1, 'fox': 3 },
    };
    const next = allocatePoint(progress, 't-rex');
    expect(next).toBe(progress);
  });

  it('never allocates points to an already mounted figure', () => {
    const progress = {
      ...startProgress('t-rex'),
      mountedIds: ['fox'],
      unassignedCredit: 5,
      allocations: { 't-rex': 1, 'fox': 10 },
    };
    const next = allocatePoint(progress, 'fox');
    expect(next).toBe(progress);
  });

  it('reclaims points from any uncompleted figure back to unassigned credit without sending to active figure', () => {
    const progress = {
      ...startProgress('t-rex'),
      unassignedCredit: 0,
      allocations: { 't-rex': 2, 'fox': 3 },
    };
    const next = reclaimPoint(progress, 'fox');
    expect(next.unassignedCredit).toBe(1);
    expect(next.allocations?.['fox']).toBe(2);
    expect(next.allocations?.['t-rex']).toBe(2);
  });

  it('never reclaims points from a mounted figure', () => {
    const progress = {
      ...startProgress('t-rex'),
      mountedIds: ['fox'],
      unassignedCredit: 0,
      allocations: { 't-rex': 2, 'fox': 5 },
    };
    const next = reclaimPoint(progress, 'fox');
    expect(next).toBe(progress);
    expect(next.mountedIds).toContain('fox');
    expect(next.allocations?.['fox']).toBe(5);
    expect(next.unassignedCredit).toBe(0);
  });
});
