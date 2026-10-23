import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { from, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { DEFAULT_CHILD_ID } from '@application/config/child';
import { DiaryStore } from '@application/services/diary-store';
import { totalPoints } from '@domain/services/growth-engine';
import { RxdbTreeRepository } from '@infrastructure/rxdb/rxdb-tree.repository';
import { PointsActions } from './points.actions';

@Injectable()
export class PointsEffects {
  private readonly actions$ = inject(Actions);
  private readonly treeRepo = inject(RxdbTreeRepository);
  private readonly diaryStore = inject(DiaryStore);

  readonly syncFromRxdb$ = createEffect(() =>
    this.treeRepo.observeByChild(DEFAULT_CHILD_ID).pipe(
      map((tree) => {
        const rawPoints = totalPoints(tree.branches);
        return PointsActions.syncFromRxdb({ rawPoints });
      }),
      catchError((error) => {
        console.warn('[PointsEffects] Failed to observe RxDB tree state:', error);
        return of({ type: '[Child Points] RxDB Observe Error' });
      })
    )
  );

  readonly addPointsToDiary$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PointsActions.addPointsToDiary),
        switchMap(({ points, domain }) =>
          from(this.diaryStore.addPoints(points, domain ?? 'comportamento')).pipe(
            catchError((err) => {
              console.warn('[PointsEffects] Failed to persist points to diary:', err);
              return of(undefined);
            })
          )
        )
      ),
    { dispatch: false }
  );
}
