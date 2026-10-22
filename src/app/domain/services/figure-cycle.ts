import { FigureProgress } from '@domain/models/figure-progress';
import { DEFAULT_RHYTHM, PLINTH_PIECES, POINTS_PER_PIECE, Rhythm } from '@domain/models/rhythm';
import { Shelf, Trophy } from '@domain/models/trophy';
import { piecesBuilt as computePiecesBuilt } from '@domain/services/pieces-built';
import { DEFAULT_FIGURE_PIECES, SHIPPED_FIGURE_PIECE_COUNTS } from '@domain/data/shipped-figures';

const TROPHIES_PER_SHELF = 3;

export const RAW_POINTS_PER_CONSOLIDATED = 10;

export interface ConsolidatedPoints {
  readonly consolidated: number;
  readonly consolidating: number;
  readonly ratio: number;
}

export function consolidatePoints(rawPoints: number): ConsolidatedPoints {
  const safe = Math.max(0, Math.floor(rawPoints));
  const consolidated = Math.floor(safe / RAW_POINTS_PER_CONSOLIDATED);
  const consolidating = safe % RAW_POINTS_PER_CONSOLIDATED;
  return {
    consolidated,
    consolidating,
    ratio: consolidating / RAW_POINTS_PER_CONSOLIDATED,
  };
}

export function startProgress(firstFigureId: string): FigureProgress {
  return {
    currentId: firstFigureId,
    mountedIds: [],
    baselinePoints: 0,
    seenPieces: PLINTH_PIECES,
    seenPiecesByFigure: { [firstFigureId]: PLINTH_PIECES },
    unassignedCredit: 0,
    consolidatingProgress: 0,
    shelfIds: [firstFigureId],
  };
}

export function figurePoints(
  totalPoints: number,
  progress: FigureProgress,
  figureId?: string,
): number {
  const id = figureId ?? progress.currentId;
  if (id === progress.currentId) {
    if (progress.allocations && id in progress.allocations) {
      return progress.allocations[id];
    }
    return Math.max(0, totalPoints - progress.baselinePoints);
  }
  return progress.allocations?.[id] ?? 0;
}

export function figureAllocation(progress: FigureProgress, figureId: string): number {
  if (progress.allocations && figureId in progress.allocations) {
    return progress.allocations[figureId];
  }
  if (figureId === progress.currentId) {
    return Math.max(0, progress.baselinePoints);
  }
  return 0;
}

export function queueAfter(progress: FigureProgress, catalogue: readonly string[]): readonly string[] {
  const taken = new Set([...progress.mountedIds, progress.currentId]);
  const activeAllocated = catalogue.filter((id) => !taken.has(id) && (progress.allocations?.[id] ?? 0) > 0);
  const unallocated = catalogue.filter((id) => !taken.has(id) && (progress.allocations?.[id] ?? 0) <= 0);
  return [...activeAllocated, ...unallocated];
}

export function mountCurrent(
  progress: FigureProgress,
  totalPoints: number,
  catalogue: readonly string[],
  rhythm: Rhythm = DEFAULT_RHYTHM,
  piecesTotal = DEFAULT_FIGURE_PIECES,
): FigureProgress {
  if (progress.mountedIds.includes(progress.currentId)) return progress;
  const [next] = queueAfter(progress, catalogue);
  const nextId = next ?? progress.currentId;
  const allocations = { ...(progress.allocations ?? {}) };
  const curPts = allocations[progress.currentId] ?? Math.max(0, progress.baselinePoints);
  const neededPts = Math.max(0, Math.ceil(((piecesTotal - PLINTH_PIECES) * POINTS_PER_PIECE) / rhythm.speed));
  const surplus = Math.max(0, curPts - neededPts);

  return {
    ...progress,
    currentId: nextId,
    mountedIds: [...progress.mountedIds, progress.currentId],
    baselinePoints: totalPoints,
    seenPieces: PLINTH_PIECES,
    allocations: {
      ...allocations,
      [progress.currentId]: Math.min(curPts, neededPts),
      [nextId]: allocations[nextId] ?? 0,
    },
    unassignedCredit: (progress.unassignedCredit ?? 0) + surplus,
  };
}

export function chooseFigure(
  progress: FigureProgress,
  figureId: string,
  catalogue: readonly string[],
  seenPieces?: number,
): FigureProgress {
  const available = queueAfter(progress, catalogue).includes(figureId);
  if (!available) return progress;
  const allocations = { ...(progress.allocations ?? {}) };
  const byFigure = { ...(progress.seenPiecesByFigure ?? {}) };
  const restoredPieces = seenPieces ?? byFigure[figureId] ?? progress.seenPieces;
  const hidden = (progress.hiddenShelfIds ?? []).filter((id) => id !== figureId);
  const shelfIds = Array.from(new Set([...(progress.shelfIds ?? [progress.currentId]), figureId]));
  return {
    ...progress,
    currentId: figureId,
    seenPieces: restoredPieces,
    seenPiecesByFigure: {
      ...byFigure,
      [figureId]: restoredPieces,
    },
    allocations: {
      ...allocations,
      [figureId]: allocations[figureId] ?? 0,
    },
    hiddenShelfIds: hidden,
    shelfIds,
  };
}

export function removeFigureFromShelf(
  progress: FigureProgress,
  figureId: string,
): FigureProgress {
  if (figureId === progress.currentId || progress.mountedIds.includes(figureId)) {
    return progress;
  }
  if (figureAllocation(progress, figureId) > 0) {
    return progress;
  }
  const hidden = new Set(progress.hiddenShelfIds ?? []);
  hidden.add(figureId);
  const shelfIds = (progress.shelfIds ?? []).filter((id) => id !== figureId);
  return {
    ...progress,
    hiddenShelfIds: Array.from(hidden),
    shelfIds,
  };
}

export function allocatePoint(
  progress: FigureProgress,
  targetFigureId: string,
): FigureProgress {
  const allocations = { ...(progress.allocations ?? {}) };
  const targetPts = allocations[targetFigureId] ?? 0;
  const unassigned = progress.unassignedCredit ?? 0;
  const shelfIds = Array.from(new Set([...(progress.shelfIds ?? [progress.currentId]), targetFigureId]));

  if (unassigned > 0) {
    return {
      ...progress,
      shelfIds,
      unassignedCredit: unassigned - 1,
      allocations: {
        ...allocations,
        [targetFigureId]: targetPts + 1,
      },
    };
  }

  if (targetFigureId !== progress.currentId) {
    const currentPts = allocations[progress.currentId] ?? 0;
    if (currentPts > 0) {
      return {
        ...progress,
        shelfIds,
        allocations: {
          ...allocations,
          [progress.currentId]: currentPts - 1,
          [targetFigureId]: targetPts + 1,
        },
      };
    }
  } else {
    const donorId = Object.keys(allocations).find(
      (id) => id !== progress.currentId && (allocations[id] ?? 0) > 0
    );
    if (donorId) {
      const nextDonorPts = (allocations[donorId] ?? 0) - 1;
      const nextMounted = nextDonorPts <= 0
        ? progress.mountedIds.filter((id) => id !== donorId)
        : progress.mountedIds;
      return {
        ...progress,
        shelfIds,
        mountedIds: nextMounted,
        allocations: {
          ...allocations,
          [donorId]: nextDonorPts,
          [progress.currentId]: targetPts + 1,
        },
      };
    }
  }

  return progress;
}

export function reclaimPoint(
  progress: FigureProgress,
  sourceFigureId: string,
): FigureProgress {
  const allocations = { ...(progress.allocations ?? {}) };
  const sourcePts = allocations[sourceFigureId] ?? figureAllocation(progress, sourceFigureId);
  if (sourcePts <= 0) return progress;

  if (sourceFigureId === progress.currentId) {
    return {
      ...progress,
      unassignedCredit: (progress.unassignedCredit ?? 0) + 1,
      allocations: {
        ...allocations,
        [progress.currentId]: sourcePts - 1,
      },
    };
  }

  const currentPts = allocations[progress.currentId] ?? 0;
  const nextSourcePts = sourcePts - 1;
  const nextMounted = nextSourcePts <= 0
    ? progress.mountedIds.filter((id) => id !== sourceFigureId)
    : progress.mountedIds;

  return {
    ...progress,
    mountedIds: nextMounted,
    allocations: {
      ...allocations,
      [sourceFigureId]: nextSourcePts,
      [progress.currentId]: currentPts + 1,
    },
  };
}

export function allocateCreditToCurrent(progress: FigureProgress): FigureProgress {
  const unassigned = progress.unassignedCredit ?? 0;
  if (unassigned <= 0) return progress;
  const allocations = { ...(progress.allocations ?? {}) };
  const currentPts = allocations[progress.currentId] ?? 0;

  return {
    ...progress,
    unassignedCredit: unassigned - 1,
    allocations: {
      ...allocations,
      [progress.currentId]: currentPts + 1,
    },
  };
}

export function arrangeShelves(
  progress: FigureProgress,
  catalogue: readonly string[],
  piecesBuilt: number,
  piecesTotal: number,
  rhythm: Rhythm = DEFAULT_RHYTHM,
): readonly Shelf[] {
  const hidden = new Set(progress.hiddenShelfIds ?? []);
  const explicitShelf = new Set(progress.shelfIds ?? [progress.currentId]);

  const visibleCatalogue = catalogue.filter((id) => {
    if (hidden.has(id)) return false;
    const isChosen = id === progress.currentId;
    const isMounted = progress.mountedIds.includes(id);
    const pts = figureAllocation(progress, id);
    const isExplicit = explicitShelf.has(id);
    return isChosen || isMounted || pts > 0 || isExplicit;
  });

  const shelfFigures = visibleCatalogue.slice(0, TROPHIES_PER_SHELF * 2);

  const trophies: Trophy[] = shelfFigures.map((id) => {
    const isChosen = id === progress.currentId;
    const isMounted = progress.mountedIds.includes(id);
    const pts = figureAllocation(progress, id);
    const totalPieces =
      isChosen && piecesTotal > 0
        ? piecesTotal
        : (SHIPPED_FIGURE_PIECE_COUNTS[id] ?? DEFAULT_FIGURE_PIECES);

    if (isMounted) {
      return {
        id,
        figureId: id,
        state: 'mounted',
        piecesBuilt: totalPieces,
        piecesTotal,
        isChosen,
        allocatedPoints: pts,
      };
    }

    if (isChosen || pts > 0) {
      const builtFromPts = computePiecesBuilt(pts, rhythm);
      const built =
        isChosen && piecesBuilt > 0
          ? Math.max(piecesBuilt, builtFromPts)
          : builtFromPts;
      const clampedBuilt = Math.min(totalPieces, Math.max(0, built));

      return {
        id,
        figureId: id,
        state: 'building',
        piecesBuilt: clampedBuilt,
        piecesTotal,
        isChosen,
        allocatedPoints: pts,
      };
    }

    return {
      id,
      figureId: id,
      state: 'queued',
      piecesBuilt: 0,
      piecesTotal,
      isChosen: false,
      allocatedPoints: 0,
    };
  });

  return chunk(trophies, TROPHIES_PER_SHELF).map((row, index) => ({
    id: `shelf-${index}`,
    trophies: row,
  }));
}

function chunk<T>(items: readonly T[], size: number): readonly (readonly T[])[] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size),
  );
}
