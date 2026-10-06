import { Rhythm } from '@domain/models/rhythm';
import { piecesBuilt, pointsPerPiece } from './pieces-built';

const steady: Rhythm = { speed: 1 };

describe('piecesBuilt', () => {
  it('starts with the plinth already built', () => {
    expect(piecesBuilt(0, steady)).toBe(1);
  });

  it('adds a piece for every full set of points', () => {
    expect(piecesBuilt(2, steady)).toBe(1);
    expect(piecesBuilt(3, steady)).toBe(2);
    expect(piecesBuilt(7, steady)).toBe(3);
  });

  it('builds faster when the speed is raised', () => {
    expect(piecesBuilt(6, { speed: 1.5 })).toBe(4);
  });

  it('never goes below the plinth', () => {
    expect(piecesBuilt(-2, steady)).toBe(1);
  });
});

describe('pointsPerPiece', () => {
  it('shrinks as the speed grows', () => {
    expect(pointsPerPiece({ speed: 1 })).toBe(3);
    expect(pointsPerPiece({ speed: 1.5 })).toBe(2);
    expect(pointsPerPiece({ speed: 3 })).toBe(1);
  });
});
