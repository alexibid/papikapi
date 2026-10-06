import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { HandDrawnDirective, IconButtonComponent } from 'ibid-ui';
import { I18nService } from '@ibid/services';
import { WIREFRAME_ROUTINE } from '@domain/data/routine-tasks';
import { RoutineTask } from '@domain/models/routine-task';
import { arrangeShelves, figurePoints } from '@domain/services/figure-cycle';
import { countMounted } from '@domain/services/mounted-trophies';
import { totalPoints } from '@domain/services/growth-engine';
import { piecesBuilt } from '@domain/services/pieces-built';
import { PLINTH_PIECES } from '@domain/models/rhythm';
import { figureAssemblyUrl, figureModelUrl } from '@application/config/figures';
import { DiaryStore } from '@application/services/diary-store';
import { FigureProgressStore } from '@application/services/figure-progress-store';
import { RhythmStore } from '@application/services/rhythm-store';
import { StickerComponent } from '@ui/atoms/sticker/sticker';
import { ProgressPipsComponent } from '@ui/molecules/progress-pips/progress-pips';
import { TaskCardComponent } from '@ui/molecules/task-card/task-card';
import { TrophyComponent } from '@ui/molecules/trophy/trophy';
import { AssemblyStageComponent } from '@ui/organisms/assembly-stage/assembly-stage';
import { SceneryComponent } from '@ui/organisms/scenery/scenery';

const CELEBRATION_MS = 2800;

@Component({
  selector: 'papikapi-home-page',
  standalone: true,
  imports: [
    AssemblyStageComponent,
    HandDrawnDirective,
    IconButtonComponent,
    StickerComponent,
    ProgressPipsComponent,
    RouterModule,
    SceneryComponent,
    TaskCardComponent,
    TrophyComponent,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(DiaryStore);
  private readonly rhythm = inject(RhythmStore);
  private readonly progress = inject(FigureProgressStore);
  private readonly pieceTotal = signal(0);
  private readonly destroyRef = inject(DestroyRef);
  private celebration?: number;
  protected readonly tasks: readonly RoutineTask[] = WIREFRAME_ROUTINE;
  protected readonly soundOn = signal(true);

  protected readonly doneCount = computed(
    () => this.tasks.filter((task) => task.status === 'done').length
  );

  protected readonly figureSource = computed(() =>
    figureAssemblyUrl(this.progress.progress().currentId)
  );

  protected readonly figureModel = computed(() =>
    figureModelUrl(this.progress.progress().currentId)
  );

  protected readonly earnedPieces = computed(() => {
    const points = totalPoints(this.store.tree().branches);
    return piecesBuilt(figurePoints(points, this.progress.progress()), this.rhythm.rhythm());
  });

  protected readonly builtPieces = signal(this.progress.progress().seenPieces);

  protected readonly shelves = computed(() =>
    arrangeShelves(
      this.progress.progress(),
      this.progress.catalogue,
      this.builtPieces(),
      this.pieceTotal()
    )
  );

  protected readonly mounted = computed(() => countMounted(this.shelves()));

  constructor() {
    void this.store.load();
    this.destroyRef.onDestroy(() => window.clearTimeout(this.celebration));
    effect(() => {
      const total = this.pieceTotal();
      if (total === 0) return;
      const earned = Math.min(total, this.earnedPieces());
      this.builtPieces.set(earned);
      untracked(() => this.progress.markSeen(earned));
    });
  }

  protected onStageReady(pieceCount: number): void {
    this.pieceTotal.set(pieceCount);
  }

  protected onStageSettled(pieces: number): void {
    const total = this.pieceTotal();
    if (total === 0 || pieces < total || this.celebration !== undefined) return;
    this.celebration = window.setTimeout(() => this.mountFinishedFigure(), CELEBRATION_MS);
  }

  private mountFinishedFigure(): void {
    this.celebration = undefined;
    this.pieceTotal.set(0);
    this.builtPieces.set(PLINTH_PIECES);
    this.progress.mountCurrent(totalPoints(this.store.tree().branches));
  }

  protected onFigureChosen(figureId: string): void {
    const seen = this.builtPieces();
    this.pieceTotal.set(0);
    this.progress.choose(figureId, seen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected toggleSound(): void {
    this.soundOn.update((on) => !on);
  }

  protected trophyLabel(state: string): string {
    return this.i18n.translate(`childTrophy_${state}`);
  }

  protected taskLabel(task: RoutineTask): string {
    return this.i18n.translate(`childTask_${task.status}`);
  }
}
