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

const catalogue = ['504i5ivf', 'g92kvjtf', 'ayv4jctc', 'rb83aitm', 'htudsj3b'];

describe('mountCurrent', () => {
  it('puts the finished figure on the shelf and starts the next one', () => {
    const next = mountCurrent(startProgress('504i5ivf'), 9, catalogue);

    expect(next.mountedIds).toEqual(['504i5ivf']);
    expect(next.currentId).toBe('g92kvjtf');
    expect(next.baselinePoints).toBe(9);
    expect(next.seenPieces).toBe(1);
  });

  it('never mounts the same figure twice', () => {
    const once = mountCurrent(startProgress('504i5ivf'), 9, catalogue);

    expect(mountCurrent({ ...once, currentId: '504i5ivf' }, 20, catalogue)).toEqual({
      ...once,
      currentId: '504i5ivf',
    });
  });

  it('keeps the last figure when the catalogue runs out', () => {
    const last = mountCurrent(startProgress('htudsj3b'), 5, ['htudsj3b']);

    expect(last.currentId).toBe('htudsj3b');
    expect(last.mountedIds).toEqual(['htudsj3b']);
  });
});

describe('figurePoints', () => {
  it('counts only what was earned since the last figure was mounted', () => {
    expect(figurePoints(14, { ...startProgress('g92kvjtf'), baselinePoints: 9 })).toBe(5);
  });

  it('never goes negative', () => {
    expect(figurePoints(2, { ...startProgress('g92kvjtf'), baselinePoints: 9 })).toBe(0);
  });
});

describe('queueAfter', () => {
  it('skips figures already mounted or being built', () => {
    const progress = { ...startProgress('g92kvjtf'), mountedIds: ['504i5ivf'] };

    expect(queueAfter(progress, catalogue)).toEqual(['ayv4jctc', 'rb83aitm', 'htudsj3b']);
  });
});

describe('arrangeShelves', () => {
  it('shows only the active figure on the shelf at the beginning with no unchosen 0-point queued figures', () => {
    const progress = startProgress('504i5ivf');
    const shelves = arrangeShelves(progress, catalogue, 0, 40);
    expect(shelves.length).toBe(1);
    expect(shelves[0].trophies.map((t) => t.figureId)).toEqual(['504i5ivf']);
  });

  it('lays out mounted, building and queued trophies in rows of three', () => {
    const progress = {
      ...startProgress('ayv4jctc'),
      mountedIds: ['504i5ivf', 'g92kvjtf'],
      shelfIds: ['ayv4jctc', 'rb83aitm', 'htudsj3b'],
    };

    const shelves = arrangeShelves(progress, catalogue, 20, 40);

    expect(shelves.map((shelf) => shelf.trophies.map((trophy) => trophy.state))).toEqual([
      ['mounted', 'mounted', 'building'],
      ['queued', 'queued'],
    ]);
  });

  it('allows removing figures from the shelf when their points are 0 via removeFigureFromShelf', () => {
    const progress = { ...startProgress('504i5ivf'), shelfIds: ['504i5ivf', 'g92kvjtf'] };
    const [shelfBefore] = arrangeShelves(progress, catalogue, 5, 40);
    expect(shelfBefore.trophies.map((t) => t.figureId)).toContain('g92kvjtf');

    const progressWithoutFox = removeFigureFromShelf(progress, 'g92kvjtf');
    expect(progressWithoutFox.hiddenShelfIds).toContain('g92kvjtf');
    const [shelfAfter] = arrangeShelves(progressWithoutFox, catalogue, 5, 40);
    expect(shelfAfter.trophies.map((t) => t.figureId)).not.toContain('g92kvjtf');
  });

  it('prevents removing the active figure or figures with points from the shelf', () => {
    const progress = { ...startProgress('504i5ivf'), allocations: { '504i5ivf': 5, 'g92kvjtf': 1 } };
    expect(removeFigureFromShelf(progress, '504i5ivf')).toBe(progress);
    expect(removeFigureFromShelf(progress, 'g92kvjtf')).toBe(progress);
  });

  it('shows how far the current figure has come with exact pieces and total', () => {
    const [shelf] = arrangeShelves(startProgress('504i5ivf'), catalogue, 20, 40);

    expect(shelf.trophies[0]).toMatchObject({ piecesBuilt: 20, piecesTotal: 40 });
  });

  it('maintains stable shelf positions when choosing different figures', () => {
    const initialProgress = { ...startProgress('504i5ivf'), allocations: { '504i5ivf': 10, 'g92kvjtf': 5, 'ayv4jctc': 3 } };
    const [initialShelf] = arrangeShelves(initialProgress, catalogue, 10, 40);
    expect(initialShelf.trophies.map((t) => t.figureId)).toEqual(['504i5ivf', 'g92kvjtf', 'ayv4jctc']);

    const switchedProgress = chooseFigure(initialProgress, 'ayv4jctc', catalogue);
    const [switchedShelf] = arrangeShelves(switchedProgress, catalogue, 5, 40);
    expect(switchedShelf.trophies.map((t) => t.figureId)).toEqual(['504i5ivf', 'g92kvjtf', 'ayv4jctc']);
    expect(switchedShelf.trophies[0].isChosen).toBe(false);
    expect(switchedShelf.trophies[2].isChosen).toBe(true);
  });

  it('keeps each figure own piecesTotal on the shelf when switching to a figure with fewer pieces', () => {
    const customCatalogue = ['6guaaxkb', '81avhktg', 'jrho0d5f'];
    const progress = {
      ...startProgress('jrho0d5f'),
      mountedIds: ['6guaaxkb'],
      shelfIds: ['6guaaxkb', '81avhktg', 'jrho0d5f'],
      allocations: { '6guaaxkb': 60, '81avhktg': 50, 'jrho0d5f': 0 },
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
    const chosen = chooseFigure(startProgress('504i5ivf'), 'ayv4jctc', catalogue, 6);

    expect(chosen.currentId).toBe('ayv4jctc');
    expect(chosen.seenPieces).toBe(6);
  });

  it('keeps the figures already mounted out of the choice', () => {
    const progress = { ...startProgress('g92kvjtf'), mountedIds: ['504i5ivf'] };

    expect(chooseFigure(progress, '504i5ivf', catalogue, 3)).toBe(progress);
  });

  it('ignores a figure that is not in the catalogue and the one already being built', () => {
    const progress = startProgress('504i5ivf');

    expect(chooseFigure(progress, 'dragon', catalogue, 3)).toBe(progress);
    expect(chooseFigure(progress, '504i5ivf', catalogue, 3)).toBe(progress);
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
      ...startProgress('504i5ivf'),
      unassignedCredit: 2,
      allocations: { '504i5ivf': 1 },
    };
    const next = allocatePoint(progress, '504i5ivf');
    expect(next.unassignedCredit).toBe(1);
    expect(next.allocations?.['504i5ivf']).toBe(2);
  });

  it('does not allocate points when credit is 0', () => {
    const progress = {
      ...startProgress('504i5ivf'),
      unassignedCredit: 0,
      allocations: { '504i5ivf': 1, 'g92kvjtf': 3 },
    };
    const next = allocatePoint(progress, '504i5ivf');
    expect(next).toBe(progress);
  });

  it('never allocates points to an already mounted figure', () => {
    const progress = {
      ...startProgress('504i5ivf'),
      mountedIds: ['g92kvjtf'],
      unassignedCredit: 5,
      allocations: { '504i5ivf': 1, 'g92kvjtf': 10 },
    };
    const next = allocatePoint(progress, 'g92kvjtf');
    expect(next).toBe(progress);
  });

  it('reclaims points from any uncompleted figure back to unassigned credit without sending to active figure', () => {
    const progress = {
      ...startProgress('504i5ivf'),
      unassignedCredit: 0,
      allocations: { '504i5ivf': 2, 'g92kvjtf': 3 },
    };
    const next = reclaimPoint(progress, 'g92kvjtf');
    expect(next.unassignedCredit).toBe(1);
    expect(next.allocations?.['g92kvjtf']).toBe(2);
    expect(next.allocations?.['504i5ivf']).toBe(2);
  });

  it('never reclaims points from a mounted figure', () => {
    const progress = {
      ...startProgress('504i5ivf'),
      mountedIds: ['g92kvjtf'],
      unassignedCredit: 0,
      allocations: { '504i5ivf': 2, 'g92kvjtf': 5 },
    };
    const next = reclaimPoint(progress, 'g92kvjtf');
    expect(next).toBe(progress);
    expect(next.mountedIds).toContain('g92kvjtf');
    expect(next.allocations?.['g92kvjtf']).toBe(5);
    expect(next.unassignedCredit).toBe(0);
  });
});
