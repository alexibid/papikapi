import { DEFAULT_CHILD_ID } from '@application/config/child';
import { DEFAULT_FIGURE_ID, canonicalFigureId } from '@domain/data/shipped-figures';
import { FigureProgress } from '@domain/models/figure-progress';
import { PLINTH_PIECES } from '@domain/models/rhythm';

export const STORAGE_KEY = 'papikapi.figure-progress';
export const CUSTOM_FIGURES_KEY = 'papikapi.custom-figures';

// The default child keeps the legacy key so existing installs need no migration.
export function figureProgressKey(childId: string): string {
  return childId === DEFAULT_CHILD_ID ? STORAGE_KEY : `${STORAGE_KEY}.${childId}`;
}

export interface PointsState {
  readonly childId: string;
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

export function restoreFromStorage(childId: string = DEFAULT_CHILD_ID): Partial<PointsState> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const rawStored = localStorage.getItem(figureProgressKey(childId));
    const rawCustom = localStorage.getItem(CUSTOM_FIGURES_KEY);
    const parsedCustom = rawCustom ? JSON.parse(rawCustom) : [];
    const customFigures = Array.isArray(parsedCustom)
      ? parsedCustom.filter((x): x is string => typeof x === 'string').map(canonicalFigureId)
      : [];

    if (!rawStored) {
      return { customFigures };
    }
    const stored = JSON.parse(rawStored);
    if (!isProgress(stored)) {
      return { customFigures };
    }
    const currentId = canonicalFigureId(stored.currentId);
    const rawAllocations = stored.allocations ?? {};
    const allocations: Record<string, number> = {};
    for (const [key, value] of Object.entries(rawAllocations)) {
      allocations[canonicalFigureId(key)] = Number(value) || 0;
    }
    if (!(currentId in allocations)) {
      allocations[currentId] = Math.max(0, stored.baselinePoints);
    }
    const rawSeen = stored.seenPiecesByFigure ?? {};
    const seenByFig: Record<string, number> = {};
    for (const [key, value] of Object.entries(rawSeen)) {
      seenByFig[canonicalFigureId(key)] = Number(value) || 0;
    }
    if (!(currentId in seenByFig)) {
      seenByFig[currentId] = stored.seenPieces;
    }

    const mountedFigureIds = Array.isArray(stored.mountedIds)
      ? stored.mountedIds.map(canonicalFigureId)
      : [];
    const shelfFigureIds = Array.isArray(stored.shelfIds)
      ? stored.shelfIds.map(canonicalFigureId)
      : [currentId];
    const hiddenShelfFigureIds = Array.isArray(stored.hiddenShelfIds)
      ? stored.hiddenShelfIds.map(canonicalFigureId)
      : [];

    return {
      rawPoints: stored.baselinePoints,
      consolidatedPoints: Math.floor(stored.baselinePoints / 10),
      consolidatingProgress: stored.consolidatingProgress ?? 0,
      unassignedCredits: stored.unassignedCredit ?? 0,
      currentFigureId: currentId,
      mountedFigureIds,
      shelfFigureIds,
      hiddenShelfFigureIds,
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
    localStorage.setItem(figureProgressKey(state.childId), JSON.stringify(progress));
    localStorage.setItem(CUSTOM_FIGURES_KEY, JSON.stringify(state.customFigures));
  } catch {
    return;
  }
}

export function getInitialPointsState(childId: string = DEFAULT_CHILD_ID): PointsState {
  const initialSaved = restoreFromStorage(childId);
  const currentFigureId = initialSaved.currentFigureId ?? DEFAULT_FIGURE_ID;
  return {
    childId,
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
