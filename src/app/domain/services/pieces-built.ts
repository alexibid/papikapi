import { POINTS_PER_PIECE, PLINTH_PIECES, Rhythm } from '@domain/models/rhythm';

const DECIMALS = 10;

export function piecesBuilt(points: number, rhythm: Rhythm): number {
  return PLINTH_PIECES + Math.floor((Math.max(0, points) * rhythm.speed) / POINTS_PER_PIECE);
}

export function pointsPerPiece(rhythm: Rhythm): number {
  return Math.round((POINTS_PER_PIECE / rhythm.speed) * DECIMALS) / DECIMALS;
}
