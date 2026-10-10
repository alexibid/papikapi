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
import { DEFAULT_FIGURE_ID } from '@domain/data/shipped-figures';
import { PLINTH_PIECES } from '@domain/models/rhythm';
import { figureAssemblyUrl, figureModelUrl, figurePdfUrl } from '@application/config/figures';
import { DiaryStore } from '@application/services/diary-store';
import { CreationProgressService } from '@application/services/creation-progress.service';
import { FigureProgressStore } from '@application/services/figure-progress-store';
import { RhythmStore } from '@application/services/rhythm-store';
import { ModelAlternativesModalComponent } from '@ui/organisms/model-alternatives-modal/model-alternatives-modal';
import { ModelCreationLoaderComponent } from '@ui/organisms/model-creation-loader/model-creation-loader';
import { ModelPickerModalComponent } from '@ui/organisms/model-picker-modal/model-picker-modal';
import { ModelPromptModalComponent } from '@ui/organisms/model-prompt-modal/model-prompt-modal';
import { ParentGateModalComponent } from '@ui/organisms/parent-gate-modal/parent-gate-modal';
import { PictogramComponent } from '@ui/atoms/pictogram/pictogram';
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
    ModelAlternativesModalComponent,
    ModelCreationLoaderComponent,
    ModelPickerModalComponent,
    ModelPromptModalComponent,
    ParentGateModalComponent,
    PictogramComponent,
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
  private readonly creation = inject(CreationProgressService);
  private readonly pieceTotal = signal(0);
  private readonly destroyRef = inject(DestroyRef);
  private celebration?: number;
  protected readonly tasks: readonly RoutineTask[] = WIREFRAME_ROUTINE;
  protected readonly soundOn = signal(true);
  protected readonly modelPickerOpen = signal(false);
  protected readonly gateOpen = signal(false);
  protected readonly promptOpen = signal(false);
  protected readonly activeCreation = signal<{
    readonly name: string;
    readonly prompt: string;
    readonly images: readonly string[];
    readonly phase?: 'alternatives' | 'mesh';
    readonly pick?: number;
  } | null>(null);

  protected readonly alternativesModalData = signal<{
    readonly name: string;
    readonly sheetUrl: string;
  } | null>(null);

  protected readonly currentModelId = computed(() => this.progress.progress().currentId);

  protected readonly doneCount = computed(
    () => this.tasks.filter((task) => task.status === 'done').length
  );

  protected readonly modelVersion = signal(Date.now());

  protected readonly figureSource = computed(() =>
    `${figureAssemblyUrl(this.progress.progress().currentId)}?v=${this.modelVersion()}`
  );

  protected readonly figureModel = computed(() =>
    `${figureModelUrl(this.progress.progress().currentId)}?v=${this.modelVersion()}`
  );

  protected readonly currentPdfUrl = computed(() =>
    `${figurePdfUrl(this.progress.progress().currentId)}?v=${this.modelVersion()}`
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
    void this.creation.fetchCatalogue().then((ids) => {
      if (ids.length > 0) {
        this.progress.registerCustomFigures(ids);
      }
    });
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

  protected onStageFailed(): void {
    if (this.currentModelId() !== DEFAULT_FIGURE_ID) {
      this.progress.select(DEFAULT_FIGURE_ID);
    }
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

  protected openModelPicker(): void {
    this.modelPickerOpen.set(true);
  }

  protected closeModelPicker(): void {
    this.modelPickerOpen.set(false);
  }

  protected onModelSelected(figureId: string): void {
    this.pieceTotal.set(0);
    this.progress.select(figureId, { allowCustom: true });
    this.modelPickerOpen.set(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected onModelEditRequested(modelId: string): void {
    this.modelPickerOpen.set(false);
    this.alternativesModalData.set({
      name: modelId,
      sheetUrl: this.creation.sheetUrl(modelId),
    });
  }

  protected async openPdf(event?: MouseEvent): Promise<void> {
    if (event) {
      event.preventDefault();
    }
    const figureId = this.currentModelId();
    const primaryUrl = `${figurePdfUrl(figureId)}?v=${this.modelVersion()}`;

    try {
      const res = await fetch(primaryUrl, { method: 'HEAD' });
      if (res.ok) {
        window.open(primaryUrl, '_blank');
        return;
      }
    } catch {
      // Fallback to Studio dev port if primary not yet picked up by asset server
    }

    try {
      const studioUrl = `http://localhost:4500/models/${figureId}/sheets.pdf?v=${this.modelVersion()}`;
      const resStudio = await fetch(studioUrl, { method: 'HEAD' });
      if (resStudio.ok) {
        window.open(studioUrl, '_blank');
        return;
      }
    } catch {
      // Fallback
    }

    window.open(primaryUrl, '_blank');
  }

  protected requestPromptAccess(): void {
    this.gateOpen.set(true);
  }

  protected closeGate(): void {
    this.gateOpen.set(false);
  }

  protected onGateUnlocked(): void {
    this.gateOpen.set(false);
    this.promptOpen.set(true);
  }

  protected closePrompt(): void {
    this.promptOpen.set(false);
  }

  protected onModelCreated(creation: {
    readonly name: string;
    readonly prompt: string;
    readonly images: readonly string[];
  }): void {
    this.closePrompt();
    this.activeCreation.set({
      name: creation.name,
      prompt: creation.prompt,
      images: creation.images,
      phase: 'alternatives',
    });
  }

  protected onAlternativesReady(data: { readonly name: string; readonly sheetUrl: string }): void {
    this.activeCreation.set(null);
    this.alternativesModalData.set(data);
  }

  protected onAlternativePicked(event: { readonly name: string; readonly pick: number }): void {
    this.alternativesModalData.set(null);
    this.activeCreation.set({
      name: event.name,
      prompt: '',
      images: [],
      phase: 'mesh',
      pick: event.pick,
    });
  }

  protected closeAlternativesModal(): void {
    this.alternativesModalData.set(null);
  }

  protected onCreationCompleted(modelName: string): void {
    this.activeCreation.set(null);
    this.modelVersion.set(Date.now());
    this.pieceTotal.set(0);
    this.progress.select(modelName, { allowCustom: true, forceReload: true });
  }

  protected cancelCreation(): void {
    this.activeCreation.set(null);
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
