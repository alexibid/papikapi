import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DEFAULT_FIGURE_PIECES, SHIPPED_FIGURE_IDS, SHIPPED_FIGURE_PIECE_COUNTS } from '@domain/data/shipped-figures';
import { FigureProgress } from '@domain/models/figure-progress';
import { DEFAULT_RHYTHM, PLINTH_PIECES } from '@domain/models/rhythm';
import { arrangeShelves, figureAllocation } from '@domain/services/figure-cycle';
import { piecesBuilt } from '@domain/services/pieces-built';
import { PointsState } from './points.state';

export const selectPointsFeature = createFeatureSelector<PointsState>('points');

export const selectChildId = createSelector(selectPointsFeature, (s) => s.childId);
export const selectRawPoints = createSelector(selectPointsFeature, (s) => s.rawPoints);
export const selectConsolidatedPoints = createSelector(selectPointsFeature, (s) => s.consolidatedPoints);
export const selectConsolidatingProgress = createSelector(selectPointsFeature, (s) => s.consolidatingProgress);
export const selectUnassignedCredits = createSelector(selectPointsFeature, (s) => s.unassignedCredits);
export const selectCurrentFigureId = createSelector(selectPointsFeature, (s) => s.currentFigureId);
export const selectMountedFigureIds = createSelector(selectPointsFeature, (s) => s.mountedFigureIds);
export const selectShelfFigureIds = createSelector(selectPointsFeature, (s) => s.shelfFigureIds);
export const selectHiddenShelfFigureIds = createSelector(selectPointsFeature, (s) => s.hiddenShelfFigureIds);
export const selectAllocations = createSelector(selectPointsFeature, (s) => s.allocations);
export const selectSeenPiecesByFigure = createSelector(selectPointsFeature, (s) => s.seenPiecesByFigure);
export const selectPieceTotalByFigure = createSelector(selectPointsFeature, (s) => s.pieceTotalByFigure);
export const selectOverridePieces = createSelector(selectPointsFeature, (s) => s.overridePieces);
export const selectCustomFigures = createSelector(selectPointsFeature, (s) => s.customFigures);

export const selectCatalogue = createSelector(selectCustomFigures, (custom) =>
  Array.from(new Set([...SHIPPED_FIGURE_IDS, ...custom]))
);

export const selectIsCurrentMounted = createSelector(
  selectCurrentFigureId,
  selectMountedFigureIds,
  (curId, mounted) => mounted.includes(curId)
);

export const selectActivePieces = createSelector(selectPointsFeature, (s) => {
  if (s.overridePieces >= 0) return s.overridePieces;
  const curId = s.currentFigureId;
  if (s.mountedFigureIds.includes(curId)) {
    return s.pieceTotalByFigure[curId] ?? SHIPPED_FIGURE_PIECE_COUNTS[curId] ?? DEFAULT_FIGURE_PIECES;
  }
  const allocated = s.allocations[curId] ?? 0;
  return piecesBuilt(allocated, DEFAULT_RHYTHM);
});

export const selectFigurePipsTotal = createSelector(selectPointsFeature, (s) => {
  const curId = s.currentFigureId;
  const total = s.pieceTotalByFigure[curId] ?? SHIPPED_FIGURE_PIECE_COUNTS[curId] ?? DEFAULT_FIGURE_PIECES;
  return Math.max(1, total - PLINTH_PIECES);
});

export const selectFigurePipsFilled = createSelector(
  selectPointsFeature,
  selectActivePieces,
  selectFigurePipsTotal,
  (s, active, totalPips) => {
    const curId = s.currentFigureId;
    const total = s.pieceTotalByFigure[curId] ?? SHIPPED_FIGURE_PIECE_COUNTS[curId] ?? DEFAULT_FIGURE_PIECES;
    if (active >= total && total > PLINTH_PIECES) {
      return 4;
    }
    const allocated = s.allocations[curId] ?? 0;
    if (s.overridePieces < 0 && allocated <= 0) return 0;
    const builtFigPieces = Math.max(0, active - PLINTH_PIECES);
    const ratio = Math.min(1, Math.max(0, builtFigPieces / totalPips));
    return Math.min(3.9, Math.round(ratio * 4 * 100) / 100);
  }
);

export const selectConsolidatingDashOffset = createSelector(
  selectConsolidatingProgress,
  (progress) => {
    const circumference = 56.548;
    const ratio = Math.max(0, Math.min(1, progress / 10));
    return `${circumference * (1 - ratio)}px`;
  }
);

export const selectCreditPips = createSelector(
  selectUnassignedCredits,
  (credits) =>
    Array.from({ length: credits }, (_, index) => ({
      id: `credit-pip-${index}`,
      filled: true,
    }))
);

export const selectAsFigureProgress = createSelector(
  selectPointsFeature,
  (s): FigureProgress => {
    const curId = s.currentFigureId;
    return {
      currentId: curId,
      mountedIds: s.mountedFigureIds,
      baselinePoints: s.rawPoints,
      seenPieces: s.seenPiecesByFigure[curId] ?? PLINTH_PIECES,
      seenPiecesByFigure: s.seenPiecesByFigure,
      unassignedCredit: s.unassignedCredits,
      consolidatingProgress: s.consolidatingProgress,
      allocations: s.allocations,
      shelfIds: s.shelfFigureIds,
      hiddenShelfIds: s.hiddenShelfFigureIds,
    };
  }
);

export const selectShelves = createSelector(
  selectAsFigureProgress,
  selectCatalogue,
  selectActivePieces,
  selectPointsFeature,
  (progress, catalogue, activePieces, s) => {
    const curId = s.currentFigureId;
    const curTotal = s.pieceTotalByFigure[curId] ?? SHIPPED_FIGURE_PIECE_COUNTS[curId] ?? DEFAULT_FIGURE_PIECES;
    return arrangeShelves(
      progress,
      catalogue,
      activePieces,
      curTotal,
      DEFAULT_RHYTHM,
      s.pieceTotalByFigure
    );
  }
);

export const selectAllocationFor = (figureId: string) =>
  createSelector(selectAsFigureProgress, (progress) => figureAllocation(progress, figureId));
