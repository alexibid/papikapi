import { createReducer, on } from '@ngrx/store';
import { DEFAULT_FIGURE_ID, DEFAULT_FIGURE_PIECES, SHIPPED_FIGURE_IDS, SHIPPED_FIGURE_PIECE_COUNTS } from '@domain/data/shipped-figures';
import { FigureProgress } from '@domain/models/figure-progress';
import { DEFAULT_RHYTHM, PLINTH_PIECES } from '@domain/models/rhythm';
import {
  allocateCreditToCurrent,
  allocatePoint,
  chooseFigure,
  consolidatePoints,
  mountCurrent,
  reclaimPoint,
  removeFigureFromShelf,
} from '@domain/services/figure-cycle';
import { PointsActions } from './points.actions';
import { PointsState, getInitialPointsState, saveStateToStorage } from './points.state';

function stateToProgress(state: PointsState): FigureProgress {
  const curId = state.currentFigureId;
  return {
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
}

function persist(state: PointsState): PointsState {
  saveStateToStorage(state);
  return state;
}

export const pointsReducer = createReducer(
  getInitialPointsState(),

  on(PointsActions.syncRawPoints, PointsActions.syncFromRxdb, (state, { rawPoints }) => {
    const { consolidated, consolidating } = consolidatePoints(rawPoints);
    const curAllocations = { ...state.allocations };
    const curId = state.currentFigureId;
    const curPts = curAllocations[curId] ?? 0;
    const sumAll =
      Object.values(curAllocations).reduce((acc, p) => acc + Math.max(0, p), 0) +
      state.unassignedCredits;

    let nextAllocations = curAllocations;
    let nextUnassigned = state.unassignedCredits;

    if (consolidated === 0 && sumAll > 0) {
      nextAllocations = { [curId]: 0 };
      nextUnassigned = 0;
    } else if (consolidated > sumAll) {
      const diff = consolidated - sumAll;
      nextAllocations = { ...curAllocations, [curId]: curPts + diff };
    } else if (consolidated < sumAll) {
      const diff = sumAll - consolidated;
      nextAllocations = { ...curAllocations, [curId]: Math.max(0, curPts - diff) };
    }

    return persist({
      ...state,
      rawPoints,
      consolidatedPoints: consolidated,
      consolidatingProgress: consolidating,
      allocations: nextAllocations,
      unassignedCredits: nextUnassigned,
    });
  }),

  on(PointsActions.setUnassignedCredit, (state, { amount }) => {
    const safe = Math.max(0, Math.round(amount));
    return persist({
      ...state,
      unassignedCredits: safe,
    });
  }),

  on(PointsActions.allocatePoint, (state, { targetFigureId }) => {
    const target = targetFigureId ?? state.currentFigureId;
    if (state.mountedFigureIds.includes(target)) return state;
    const next = allocatePoint(stateToProgress(state), target);
    return persist({
      ...state,
      allocations: next.allocations ?? state.allocations,
      unassignedCredits: next.unassignedCredit ?? 0,
      shelfFigureIds: next.shelfIds ?? state.shelfFigureIds,
      mountedFigureIds: state.mountedFigureIds,
    });
  }),

  on(PointsActions.reclaimPoint, (state, { sourceFigureId }) => {
    const source = sourceFigureId ?? state.currentFigureId;
    if (state.mountedFigureIds.includes(source)) return state;
    const next = reclaimPoint(stateToProgress(state), source);
    return persist({
      ...state,
      allocations: next.allocations ?? state.allocations,
      unassignedCredits: next.unassignedCredit ?? state.unassignedCredits,
      mountedFigureIds: state.mountedFigureIds,
    });
  }),

  on(PointsActions.allocateCreditToCurrent, (state) => {
    if (state.mountedFigureIds.includes(state.currentFigureId)) return state;
    const next = allocateCreditToCurrent(stateToProgress(state));
    return persist({
      ...state,
      allocations: next.allocations ?? state.allocations,
      unassignedCredits: next.unassignedCredit ?? 0,
    });
  }),

  on(PointsActions.chooseFigure, (state, { figureId, seenPieces }) => {
    const catalogue = Array.from(new Set([...SHIPPED_FIGURE_IDS, ...state.customFigures]));
    const next = chooseFigure(stateToProgress(state), figureId, catalogue, seenPieces);
    return persist({
      ...state,
      currentFigureId: next.currentId,
      mountedFigureIds: next.mountedIds,
      allocations: next.allocations ?? state.allocations,
      seenPiecesByFigure: next.seenPiecesByFigure ?? state.seenPiecesByFigure,
      shelfFigureIds: next.shelfIds ?? state.shelfFigureIds,
      hiddenShelfFigureIds: next.hiddenShelfIds ?? state.hiddenShelfFigureIds,
      overridePieces: -1,
    });
  }),

  on(PointsActions.selectFigure, (state, { figureId, options }) => {
    let customList = state.customFigures;
    if (options?.allowCustom) {
      const clean = figureId.trim().toLowerCase();
      if (clean && !SHIPPED_FIGURE_IDS.includes(clean) && !customList.includes(clean)) {
        customList = [...customList, clean];
      }
    }
    const catalogue = Array.from(new Set([...SHIPPED_FIGURE_IDS, ...customList]));
    if (!catalogue.includes(figureId)) return state;

    const mountedIds = options?.keepMounted
      ? state.mountedFigureIds
      : state.mountedFigureIds.filter((id) => id !== figureId);

    const byFigure = { ...state.seenPiecesByFigure };
    const restoredPieces = options?.forceReload
      ? PLINTH_PIECES
      : (byFigure[figureId] ?? PLINTH_PIECES);
    byFigure[figureId] = restoredPieces;

    const allocations = { ...state.allocations };
    allocations[figureId] = allocations[figureId] ?? 0;

    const hidden = state.hiddenShelfFigureIds.filter((id) => id !== figureId);
    const shelfIds = Array.from(new Set([...state.shelfFigureIds, figureId]));

    return persist({
      ...state,
      currentFigureId: figureId,
      customFigures: customList,
      mountedFigureIds: mountedIds,
      seenPiecesByFigure: byFigure,
      allocations,
      hiddenShelfFigureIds: hidden,
      shelfFigureIds: shelfIds,
      overridePieces: -1,
    });
  }),

  on(PointsActions.removeFigureFromShelf, (state, { figureId }) => {
    const next = removeFigureFromShelf(stateToProgress(state), figureId);
    return persist({
      ...state,
      shelfFigureIds: next.shelfIds ?? state.shelfFigureIds,
      hiddenShelfFigureIds: next.hiddenShelfIds ?? state.hiddenShelfFigureIds,
    });
  }),

  on(PointsActions.addFigurePoints, (state, { figureId, count = 1 }) => {
    const safeCount = Math.max(1, Math.round(count));
    const allocations = { ...state.allocations };
    allocations[figureId] = (allocations[figureId] ?? 0) + safeCount;
    const hidden = state.hiddenShelfFigureIds.filter((id) => id !== figureId);
    const shelfIds = Array.from(new Set([...state.shelfFigureIds, figureId]));

    return persist({
      ...state,
      allocations,
      hiddenShelfFigureIds: hidden,
      shelfFigureIds: shelfIds,
    });
  }),

  on(PointsActions.removeFigurePoints, (state, { figureId, count = 1 }) => {
    if (state.mountedFigureIds.includes(figureId)) return state;

    const safeCount = Math.max(1, Math.round(count));
    const allocations = { ...state.allocations };
    const currentPts = allocations[figureId] ?? 0;
    if (currentPts <= 0) return state;

    const removed = Math.min(currentPts, safeCount);
    allocations[figureId] = currentPts - removed;

    return persist({
      ...state,
      allocations,
      unassignedCredits: state.unassignedCredits + removed,
    });
  }),

  on(PointsActions.mountCurrentFigure, (state, { totalPoints }) => {
    const catalogue = Array.from(new Set([...SHIPPED_FIGURE_IDS, ...state.customFigures]));
    const pts = totalPoints ?? state.rawPoints;
    const curId = state.currentFigureId;
    const curTotal = state.pieceTotalByFigure[curId] ?? SHIPPED_FIGURE_PIECE_COUNTS[curId] ?? DEFAULT_FIGURE_PIECES;
    const next = mountCurrent(stateToProgress(state), pts, catalogue, DEFAULT_RHYTHM, curTotal);

    return persist({
      ...state,
      currentFigureId: next.currentId,
      mountedFigureIds: next.mountedIds,
      allocations: next.allocations ?? state.allocations,
      unassignedCredits: next.unassignedCredit ?? state.unassignedCredits,
      seenPiecesByFigure: {
        ...state.seenPiecesByFigure,
        [curId]: curTotal,
        [next.currentId]: next.seenPieces,
      },
      overridePieces: -1,
    });
  }),

  on(PointsActions.setStagePieceTotal, (state, { figureId, total }) => {
    if (total <= 0) return state;
    return {
      ...state,
      pieceTotalByFigure: {
        ...state.pieceTotalByFigure,
        [figureId]: total,
      },
    };
  }),

  on(PointsActions.setOverridePieces, (state, { pieces }) => ({
    ...state,
    overridePieces: pieces,
  })),

  on(PointsActions.markFigureSeen, (state, { figureId, pieces }) => {
    if (state.seenPiecesByFigure[figureId] === pieces) return state;
    const seenPiecesByFigure = {
      ...state.seenPiecesByFigure,
      [figureId]: pieces,
    };
    return persist({
      ...state,
      seenPiecesByFigure,
    });
  }),

  on(PointsActions.registerCustomFigures, (state, { ids }) => {
    const cur = state.customFigures;
    const set = new Set([...cur, ...ids.map((id) => id.trim().toLowerCase())]);
    const next = Array.from(set).filter((id) => !SHIPPED_FIGURE_IDS.includes(id) && id.length > 0);
    return persist({
      ...state,
      customFigures: next,
    });
  }),

  on(PointsActions.reset, () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('papikapi.figure-progress');
      localStorage.removeItem('papikapi.custom-figures');
    }
    return {
      rawPoints: 0,
      consolidatedPoints: 0,
      consolidatingProgress: 0,
      unassignedCredits: 0,
      currentFigureId: DEFAULT_FIGURE_ID,
      mountedFigureIds: [],
      shelfFigureIds: [DEFAULT_FIGURE_ID],
      hiddenShelfFigureIds: [],
      allocations: { [DEFAULT_FIGURE_ID]: 0 },
      seenPiecesByFigure: { [DEFAULT_FIGURE_ID]: PLINTH_PIECES },
      pieceTotalByFigure: {},
      overridePieces: -1,
      customFigures: [],
    };
  })
);
