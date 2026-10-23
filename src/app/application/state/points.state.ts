import { DEFAULT_FIGURE_ID } from '@domain/data/shipped-figures';
import { FigureProgress } from '@domain/models/figure-progress';
import { PLINTH_PIECES } from '@domain/models/rhythm';

export const STORAGE_KEY = 'papikapi.figure-progress';
export const CUSTOM_FIGURES_KEY = 'papikapi.custom-figures';

export interface PointsState {
  readonly rawPoints: number;
  readonly consolidatedPoints: number;
  readonly consolidatingProgress: number;
  readonly unassignedCredits: number;
  readonly currentFigureId: string;
  readonly mountedFigureIds: readonly string[];
  readonly shelfFigureIds: readonly string[];
  readonly hiddenShelfFigureIds: readonly string[];
  readonly allocations: Readonly<Record<string, number>>;
  readonly seenPiecesByFigure: Readonly<Record<string, number>>;
  readonly pieceTotalByFigure: Readonly<Record<string, number>>;
  readonly overridePieces: number;
  readonly customFigures: readonly string[];
}

export function isProgress(value: unknown): value is FigureProgress {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['currentId'] === 'string' &&
    Array.isArray(candidate['mountedIds']) &&
    candidate['mountedIds'].every((id) => typeof id === 'string') &&
    typeof candidate['baselinePoints'] === 'number' &&
    typeof candidate['seenPieces'] === 'number'
  );
}

export function restoreFromStorage(): Partial<PointsState> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const rawStored = localStorage.getItem(STORAGE_KEY);
    const rawCustom = localStorage.getItem(CUSTOM_FIGURES_KEY);
    const parsedCustom = rawCustom ? JSON.parse(rawCustom) : [];
    const customFigures = Array.isArray(parsedCustom)
      ? parsedCustom.filter((x): x is string => typeof x === 'string')
      : [];

    if (!rawStored) {
      return { customFigures };
    }
    const stored = JSON.parse(rawStored);
    if (!isProgress(stored)) {
      return { customFigures };
    }
    const currentId = stored.currentId;
    const allocations = { ...(stored.allocations ?? {}) };
    if (!(currentId in allocations)) {
      allocations[currentId] = Math.max(0, stored.baselinePoints);
    }
    const seenByFig = { ...(stored.seenPiecesByFigure ?? {}) };
    if (!(currentId in seenByFig)) {
      seenByFig[currentId] = stored.seenPieces;
    }

    return {
      rawPoints: stored.baselinePoints,
      consolidatedPoints: Math.floor(stored.baselinePoints / 10),
      consolidatingProgress: stored.consolidatingProgress ?? 0,
      unassignedCredits: stored.unassignedCredit ?? 0,
      currentFigureId: currentId,
      mountedFigureIds: stored.mountedIds,
      shelfFigureIds: Array.isArray(stored.shelfIds) ? stored.shelfIds : [currentId],
      hiddenShelfFigureIds: Array.isArray(stored.hiddenShelfIds) ? stored.hiddenShelfIds : [],
      allocations,
      seenPiecesByFigure: seenByFig,
      customFigures,
    };
  } catch {
    return {};
  }
}

export function saveStateToStorage(state: PointsState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const curId = state.currentFigureId;
    const progress: FigureProgress = {
      currentId: curId,
      mountedIds: state.mountedFigureIds,
      baselinePoints: state.rawPoints,
      seenPieces: state.seenPiecesByFigure[curId] ?? PLINTH_PIECES,
      seenPiecesByFigure: state.seenPiecesByFigure,
      unassignedCredit: state.unassignedCredits,
      consolidatingProgress: state.consolidatingProgress,
      allocations: state.allocations,
      shelfIds: state.shelfFigureIds,
      hiddenShelfIds: state.hiddenShelfFigureIds,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    localStorage.setItem(CUSTOM_FIGURES_KEY, JSON.stringify(state.customFigures));
  } catch {
    return;
  }
}

export function getInitialPointsState(): PointsState {
  const initialSaved = restoreFromStorage();
  const currentFigureId = initialSaved.currentFigureId ?? DEFAULT_FIGURE_ID;
  return {
    rawPoints: initialSaved.rawPoints ?? 0,
    consolidatedPoints: initialSaved.consolidatedPoints ?? 0,
    consolidatingProgress: initialSaved.consolidatingProgress ?? 0,
    unassignedCredits: initialSaved.unassignedCredits ?? 0,
    currentFigureId,
    mountedFigureIds: initialSaved.mountedFigureIds ?? [],
    shelfFigureIds: initialSaved.shelfFigureIds ?? [currentFigureId],
    hiddenShelfFigureIds: initialSaved.hiddenShelfFigureIds ?? [],
    allocations: initialSaved.allocations ?? { [currentFigureId]: 0 },
    seenPiecesByFigure: initialSaved.seenPiecesByFigure ?? { [currentFigureId]: PLINTH_PIECES },
    pieceTotalByFigure: {},
    overridePieces: -1,
    customFigures: initialSaved.customFigures ?? [],
  };
}
