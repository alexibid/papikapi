import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { BehaviourDomainId } from '@domain/models/behaviour-domain';

export const PointsActions = createActionGroup({
  source: 'Child Points',
  events: {
    'Sync Raw Points': props<{ rawPoints: number }>(),
    'Sync From Rxdb': props<{ rawPoints: number }>(),
    'Set Unassigned Credit': props<{ amount: number }>(),
    'Allocate Point': props<{ targetFigureId?: string }>(),
    'Reclaim Point': props<{ sourceFigureId?: string }>(),
    'Allocate Credit To Current': emptyProps(),
    'Choose Figure': props<{ figureId: string; seenPieces?: number }>(),
    'Select Figure': props<{
      figureId: string;
      options?: { readonly allowCustom?: boolean; readonly forceReload?: boolean; readonly keepMounted?: boolean };
    }>(),
    'Remove Figure From Shelf': props<{ figureId: string }>(),
    'Add Figure Points': props<{ figureId: string; count?: number }>(),
    'Remove Figure Points': props<{ figureId: string; count?: number }>(),
    'Mount Current Figure': props<{ totalPoints?: number }>(),
    'Set Stage Piece Total': props<{ figureId: string; total: number }>(),
    'Set Override Pieces': props<{ pieces: number }>(),
    'Mark Figure Seen': props<{ figureId: string; pieces: number }>(),
    'Register Custom Figures': props<{ ids: readonly string[] }>(),
    'Add Points To Diary': props<{ points: number; domain?: BehaviourDomainId }>(),
    'Load Child': props<{ childId: string }>(),
    'Reset': emptyProps(),
  },
});
