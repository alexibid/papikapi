import { FigureProgress } from '@domain/models/figure-progress';
import { PLINTH_PIECES } from '@domain/models/rhythm';
import { Shelf, Trophy } from '@domain/models/trophy';

const TROPHIES_PER_SHELF = 3;
const QUEUED_AHEAD = 5;
const TROPHY_PIPS = 4;

export function startProgress(firstFigureId: string): FigureProgress {
  return { currentId: firstFigureId, mountedIds: [], baselinePoints: 0, seenPieces: PLINTH_PIECES };
}

export function figurePoints(totalPoints: number, progress: FigureProgress): number {
  return Math.max(0, totalPoints - progress.baselinePoints);
}

export function queueAfter(progress: FigureProgress, catalogue: readonly string[]): readonly string[] {
  const taken = new Set([...progress.mountedIds, progress.currentId]);
  return catalogue.filter((id) => !taken.has(id));
}

export function mountCurrent(
  progress: FigureProgress,
  totalPoints: number,
  catalogue: readonly string[],
): FigureProgress {
  if (progress.mountedIds.includes(progress.currentId)) return progress;
  const [next] = queueAfter(progress, catalogue);
  return {
    currentId: next ?? progress.currentId,
    mountedIds: [...progress.mountedIds, progress.currentId],
    baselinePoints: totalPoints,
    seenPieces: PLINTH_PIECES,
  };
}

export function chooseFigure(
  progress: FigureProgress,
  figureId: string,
  catalogue: readonly string[],
  seenPieces: number,
): FigureProgress {
  const available = queueAfter(progress, catalogue).includes(figureId);
  return available ? { ...progress, currentId: figureId, seenPieces } : progress;
}

export function arrangeShelves(
  progress: FigureProgress,
  catalogue: readonly string[],
  piecesBuilt: number,
  piecesTotal: number,
): readonly Shelf[] {
  const trophies: readonly Trophy[] = [
    ...progress.mountedIds.map((id) => mounted(id)),
    ...(progress.mountedIds.includes(progress.currentId)
      ? []
      : [building(progress.currentId, piecesBuilt, piecesTotal)]),
    ...queueAfter(progress, catalogue)
      .slice(0, QUEUED_AHEAD)
      .map((id) => queued(id)),
  ];
  return chunk(trophies, TROPHIES_PER_SHELF).map((row, index) => ({
    id: `shelf-${index}`,
    trophies: row,
  }));
}

function mounted(figureId: string): Trophy {
  return { id: figureId, figureId, state: 'mounted', piecesBuilt: 0, piecesTotal: 0 };
}

function queued(figureId: string): Trophy {
  return { id: figureId, figureId, state: 'queued', piecesBuilt: 0, piecesTotal: 0 };
}

function building(figureId: string, piecesBuilt: number, piecesTotal: number): Trophy {
  const share = piecesTotal > 0 ? piecesBuilt / piecesTotal : 0;
  return {
    id: figureId,
    figureId,
    state: 'building',
    piecesBuilt: Math.round(share * TROPHY_PIPS),
    piecesTotal: TROPHY_PIPS,
  };
}

function chunk<T>(items: readonly T[], size: number): readonly (readonly T[])[] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size),
  );
}
