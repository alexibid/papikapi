import {
  Component,
  DestroyRef,
  DoCheck,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  FocusStateDirective,
  HandDrawnDirective,
  IconButtonComponent,
  TactileDirective,
} from 'ibid-ui';
import { I18nService } from '@ibid/services';
import { PapikapiSensoryFeedbackAdapter } from '@ui/interaction/papikapi-sensory-feedback.adapter';
import { BehaviourDomainId } from '@domain/models/behaviour-domain';
import { ChildProfile } from '@domain/models/child-profile';
import { RoutineTask } from '@domain/models/routine-task';
import { arrangeShelves } from '@domain/services/figure-cycle';
import { totalPoints } from '@domain/services/growth-engine';
import { piecesBuilt } from '@domain/services/pieces-built';
import { PLINTH_PIECES } from '@domain/models/rhythm';
import { DEFAULT_FIGURE_PIECES, SHIPPED_FIGURE_PIECE_COUNTS } from '@domain/data/shipped-figures';
import {
  figureAssemblyUrl,
  figureModelUrl,
  figurePdfUrl,
  isStaticAsset,
} from '@application/config/figures';
import { parseArgs } from '@application/services/dev-bridge';
import { FigureAssetsService } from '@application/services/figure-assets.service';
import { DiaryStore } from '@application/services/diary-store';
import { ClassroomStore } from '@application/services/classroom-store';
import { CreationProgressService } from '@application/services/creation-progress.service';
import { FigureProgressStore } from '@application/services/figure-progress-store';
import { RhythmStore } from '@application/services/rhythm-store';
import { RoutineProgressStore } from '@application/services/routine-progress-store';
import { ModelAlternativesModalComponent } from '@ui/organisms/model-alternatives-modal/model-alternatives-modal';
import { ModelCreationLoaderComponent } from '@ui/organisms/model-creation-loader/model-creation-loader';
import { ModelPickerModalComponent } from '@ui/organisms/model-picker-modal/model-picker-modal';
import { ModelPromptModalComponent } from '@ui/organisms/model-prompt-modal/model-prompt-modal';
import { ParentGateModalComponent } from '@ui/organisms/parent-gate-modal/parent-gate-modal';
import { PictogramComponent } from '@ui/atoms/pictogram/pictogram';
import { StickerComponent } from '@ui/atoms/sticker/sticker';
import { ChildSwitcherComponent } from '@ui/molecules/child-switcher/child-switcher';
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
    ChildSwitcherComponent,
    FocusStateDirective,
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
    TactileDirective,
    TaskCardComponent,
    TrophyComponent,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage implements DoCheck {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(DiaryStore);
  protected readonly classroom = inject(ClassroomStore);
  private readonly sensory = inject(PapikapiSensoryFeedbackAdapter);
  private readonly rhythm = inject(RhythmStore);
  private readonly progress = inject(FigureProgressStore);
  private readonly creation = inject(CreationProgressService);
  private readonly figureAssets = inject(FigureAssetsService);
  private readonly routineStore = inject(RoutineProgressStore);
  private readonly pieceTotal = signal(0);
  private readonly destroyRef = inject(DestroyRef);
  private celebration?: number;
  protected readonly tasks = this.routineStore.tasks;
  protected readonly doneCount = this.routineStore.doneCount;
  protected readonly soundOn = this.sensory.soundEnabled;
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

  readonly isCurrentMounted = computed(() =>
    this.progress.progress().mountedIds.includes(this.currentModelId()) &&
    this.isCurrentComplete()
  );

  readonly isCurrentComplete = computed(() => {
    const curId = this.currentModelId();
    const total = this.pieceTotal() || this.defaultPiecesFor(curId);
    return total > PLINTH_PIECES && this.activePieces() >= total;
  });

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

  protected readonly unassignedCredits = computed(() => this.progress.unassignedCredits());

  protected readonly consolidatingProgress = computed(() => this.progress.consolidatingProgress());

  protected readonly consolidatingDashOffset = computed(() => {
    const circumference = 56.548;
    const ratio = Math.max(0, Math.min(1, this.consolidatingProgress() / 10));
    return `${circumference * (1 - ratio)}px`;
  });

  readonly figurePipsTotal = computed(() => {
    const curId = this.currentModelId();
    const total = this.pieceTotal() || this.defaultPiecesFor(curId);
    return Math.max(1, total - PLINTH_PIECES);
  });

  readonly figurePipsFilled = computed(() => {
    const curId = this.currentModelId();
    const total = this.pieceTotal() || this.defaultPiecesFor(curId);
    const totalFigPieces = this.figurePipsTotal();
    const built = this.activePieces();
    if (built >= total && total > PLINTH_PIECES) {
      return totalFigPieces;
    }
    const allocated = this.progress.allocation(curId);
    if (this.overridePieces() < 0 && allocated <= 0) return 0;
    const builtFigPieces = Math.max(0, built - PLINTH_PIECES);
    return Math.min(Math.max(0, totalFigPieces - 1), Math.max(1, builtFigPieces));
  });

  protected readonly creditPips = computed(() =>
    Array.from({ length: this.unassignedCredits() }, (_, index) => ({
      id: `credit-pip-${index}`,
      filled: true,
    }))
  );

  protected defaultPiecesFor(figureId: string): number {
    return (
      this.pieceTotalByFigure()[figureId] ??
      SHIPPED_FIGURE_PIECE_COUNTS[figureId] ??
      DEFAULT_FIGURE_PIECES
    );
  }

  protected readonly pieceTotalByFigure = signal<Readonly<Record<string, number>>>({});

  protected readonly earnedPieces = computed(() => {
    const curId = this.progress.progress().currentId;
    if (this.progress.progress().mountedIds.includes(curId)) {
      return this.pieceTotal() || this.defaultPiecesFor(curId);
    }
    const allocated = this.progress.allocation(curId);
    return piecesBuilt(allocated, this.rhythm.rhythm());
  });

  protected readonly builtPieces = signal(this.progress.progress().seenPieces);
  protected readonly overridePieces = signal<number>(-1);

  readonly activePieces = computed(() => {
    const override = this.overridePieces();
    if (override >= 0) return override;
    const curId = this.currentModelId();
    if (this.progress.progress().mountedIds.includes(curId)) {
      return this.pieceTotal() || this.defaultPiecesFor(curId);
    }
    return this.builtPieces();
  });

  testPoints = 0;
  testPieces = -1;
  routineDoneCount = 0;

  private previousTestPoints = 0;
  private previousTestPieces = -1;
  private previousRoutineCount = -1;

  ngDoCheck(): void {
    if (this.testPoints !== this.previousTestPoints) {
      const diff = Number(this.testPoints) - this.previousTestPoints;
      this.previousTestPoints = Number(this.testPoints);
      if (diff !== 0) {
        void this.addPoints(diff);
      }
      this.progress.syncTotalPoints(Number(this.testPoints));
    }
    if (this.testPieces !== this.previousTestPieces) {
      this.previousTestPieces = Number(this.testPieces);
      this.overridePieces.set(Number(this.testPieces));
    }
    if (this.routineDoneCount !== this.previousRoutineCount) {
      this.previousRoutineCount = Number(this.routineDoneCount);
      const target = Math.max(0, Math.min(this.tasks().length, Number(this.routineDoneCount)));
      for (const [idx, task] of this.tasks().entries()) {
        if (idx < target && task.status !== 'done') {
          this.routineStore.completeTask(task.id);
        } else if (idx >= target && task.status === 'done') {
          this.routineStore.toggleTask(task.id);
        }
      }
    }
  }

  protected readonly shelves = computed(() =>
    arrangeShelves(
      this.progress.progress(),
      this.progress.catalogue,
      this.activePieces(),
      this.pieceTotal() || this.defaultPiecesFor(this.currentModelId()),
      this.rhythm.rhythm(),
      this.pieceTotalByFigure(),
    )
  );

  constructor() {
    void this.store.load();
    void this.creation.fetchCatalogue().then((ids) => {
      if (ids.length > 0) {
        this.progress.registerCustomFigures(ids);
      }
    });
    this.destroyRef.onDestroy(() => {
      window.clearTimeout(this.celebration);
      if (typeof window !== 'undefined') {
        delete (window as unknown as { papikapi?: unknown }).papikapi;
      }
    });

    if (typeof window !== 'undefined') {
      (window as unknown as { papikapi?: unknown }).papikapi = {
        addPoints: (amountOrFigureId?: number | string, domainOrFigureId?: BehaviourDomainId | string) => {
          if (
            typeof amountOrFigureId === 'number' &&
            typeof domainOrFigureId === 'string' &&
            ['comportamento', 'rotina', 'autonomia', 'social', 'emocional'].includes(domainOrFigureId)
          ) {
            void this.addPoints(amountOrFigureId, domainOrFigureId as BehaviourDomainId);
            return;
          }
          const { targetId, count } = parseArgs(
            amountOrFigureId,
            domainOrFigureId,
            this.currentModelId()
          );
          if (amountOrFigureId === undefined && domainOrFigureId === undefined && this.progress.unassignedCredits() > 0) {
            this.progress.allocatePoint(targetId);
          } else {
            const unassigned = this.progress.unassignedCredits();
            if (unassigned > 0) {
              const fromCredit = Math.min(unassigned, count);
              for (let i = 0; i < fromCredit; i++) {
                this.progress.allocatePoint(targetId);
              }
              const remainder = count - fromCredit;
              if (remainder > 0) {
                this.progress.addFigurePoints(targetId, remainder);
              }
            } else {
              this.progress.addFigurePoints(targetId, count);
            }
          }
          const curId = this.currentModelId();
          const allocated = this.progress.allocation(curId);
          this.builtPieces.set(piecesBuilt(allocated, this.rhythm.rhythm()));
        },
        removePoints: (amountOrFigureId?: number | string, figureId?: string) => {
          const { targetId, count } = parseArgs(
            amountOrFigureId,
            figureId,
            this.currentModelId()
          );
          if (amountOrFigureId === undefined && figureId === undefined) {
            this.progress.reclaimPoint(targetId);
          } else {
            this.progress.removeFigurePoints(targetId, count);
          }
          const curId = this.currentModelId();
          const allocated = this.progress.allocation(curId);
          this.builtPieces.set(piecesBuilt(allocated, this.rhythm.rhythm()));
        },
        allocatePoint: (figureId?: string) => this.progress.allocatePoint(figureId ?? this.currentModelId()),
        reclaimPoint: (figureId?: string) => this.progress.reclaimPoint(figureId ?? this.currentModelId()),
        removeFigure: (figureId: string) => this.progress.removeFigureFromShelf(figureId),
        removeFigureFromShelf: (figureId: string) => this.progress.removeFigureFromShelf(figureId),
        setPieces: (pieces: number) => {
          this.overridePieces.set(pieces);
          this.builtPieces.set(pieces);
        },
        addCredit: (amount = 1) => this.progress.setUnassignedCredit(this.progress.unassignedCredits() + amount),
        reset: () => this.store.reset(),
        store: this.store,
        progress: this.progress,
        home: this,
      };
    }

    effect(() => {
      const total = this.pieceTotal() || this.defaultPiecesFor(this.currentModelId());
      const earned = Math.min(total, this.earnedPieces());
      this.builtPieces.set(earned);
      untracked(() => this.progress.markSeen(earned));
    });

    effect(() => {
      const pts = totalPoints(this.store.tree().branches);
      untracked(() => {
        this.testPoints = pts;
        this.previousTestPoints = pts;
        this.progress.syncTotalPoints(pts);
      });
    });

    effect(() => {
      const count = this.doneCount();
      untracked(() => {
        this.routineDoneCount = count;
        this.previousRoutineCount = count;
      });
    });
  }

  async addPoints(points = 5, domain: BehaviourDomainId = 'comportamento'): Promise<void> {
    const nextTotal = (this.testPoints || 0) + points;
    this.testPoints = nextTotal;
    this.previousTestPoints = nextTotal;
    this.progress.syncTotalPoints(nextTotal);

    const total = this.pieceTotal() || this.defaultPiecesFor(this.currentModelId());
    const earned = Math.min(total, this.earnedPieces());
    this.builtPieces.set(earned);

    await this.store.addPoints(points, domain);
  }

  protected onStageReady(pieceCount: number): void {
    this.pieceTotal.set(pieceCount);
    const curId = this.currentModelId();
    if (pieceCount > 0) {
      this.pieceTotalByFigure.update((map) => ({ ...map, [curId]: pieceCount }));
    }
  }

  protected onStageFailed(): void {
    console.warn(`[papikapi] Assembly stage failed to load figure: ${this.currentModelId()}`);
  }

  protected onStageSettled(pieces: number): void {
    const total = this.pieceTotal() || this.defaultPiecesFor(this.currentModelId());
    const curId = this.currentModelId();
    if (this.progress.progress().mountedIds.includes(curId)) return;
    if (total === 0 || pieces < total || this.celebration !== undefined) return;
    this.celebration = window.setTimeout(() => this.mountFinishedFigure(), CELEBRATION_MS);
  }

  private mountFinishedFigure(): void {
    this.celebration = undefined;
    this.pieceTotal.set(0);
    this.builtPieces.set(PLINTH_PIECES);
    this.progress.mountCurrent(totalPoints(this.store.tree().branches));
  }

  protected onCreditBarClicked(): void {
    if (this.unassignedCredits() <= 0 || this.isCurrentComplete()) return;
    this.progress.allocateCreditToCurrent();
    const curId = this.currentModelId();
    const allocated = this.progress.allocation(curId);
    this.builtPieces.set(piecesBuilt(allocated, this.rhythm.rhythm()));
  }

  protected onAllocatePoint(figureId: string): void {
    this.progress.allocatePoint(figureId);
    const curId = this.currentModelId();
    const allocated = this.progress.allocation(curId);
    this.builtPieces.set(piecesBuilt(allocated, this.rhythm.rhythm()));
  }

  protected onReclaimPoint(figureId: string): void {
    this.progress.reclaimPoint(figureId);
    const curId = this.currentModelId();
    const allocated = this.progress.allocation(curId);
    this.builtPieces.set(piecesBuilt(allocated, this.rhythm.rhythm()));
  }

  protected onRemoveTrophy(figureId: string): void {
    this.progress.removeFigureFromShelf(figureId);
  }

  protected onFigureChosen(figureId: string): void {
    window.clearTimeout(this.celebration);
    this.celebration = undefined;
    this.overridePieces.set(-1);
    this.pieceTotal.set(0);

    const isMounted = this.progress.progress().mountedIds.includes(figureId);
    if (isMounted) {
      this.progress.select(figureId, { keepMounted: true });
      this.builtPieces.set(this.defaultPiecesFor(figureId));
    } else {
      this.progress.choose(figureId);
      const allocated = this.progress.allocation(figureId);
      this.builtPieces.set(piecesBuilt(allocated, this.rhythm.rhythm()));
    }
  }

  protected openModelPicker(): void {
    this.modelPickerOpen.set(true);
  }

  protected closeModelPicker(): void {
    this.modelPickerOpen.set(false);
  }

  protected onModelSelected(figureId: string): void {
    window.clearTimeout(this.celebration);
    this.celebration = undefined;
    this.overridePieces.set(-1);
    this.pieceTotal.set(0);
    const isMounted = this.progress.progress().mountedIds.includes(figureId);
    this.progress.select(figureId, { allowCustom: true, keepMounted: isMounted });
    if (isMounted) {
      this.builtPieces.set(this.defaultPiecesFor(figureId));
    } else {
      const allocated = this.progress.allocation(figureId);
      this.builtPieces.set(piecesBuilt(allocated, this.rhythm.rhythm()));
    }
    this.modelPickerOpen.set(false);
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

    const studioUrl = await this.studioPdfUrl(figureId);
    if (studioUrl) {
      window.open(studioUrl, '_blank');
      return;
    }

    try {
      const res = await fetch(primaryUrl, { method: 'HEAD' });
      if (isStaticAsset(res)) {
        window.open(primaryUrl, '_blank');
        return;
      }
    } catch {
      // Fallback
    }

    const publishedUrl = await this.publishedPdfUrl(figureId);
    if (publishedUrl) {
      window.open(publishedUrl, '_blank');
      return;
    }

    window.open(primaryUrl, '_blank');
  }

  private async studioPdfUrl(figureId: string): Promise<string | null> {
    const url = `http://localhost:4500/models/${figureId}/sheets.pdf?v=${this.modelVersion()}`;
    try {
      return isStaticAsset(await fetch(url, { method: 'HEAD' })) ? url : null;
    } catch {
      return null;
    }
  }

  private async publishedPdfUrl(figureId: string): Promise<string | null> {
    try {
      return await this.figureAssets.pdfUrl(figureId);
    } catch {
      return null;
    }
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
    this.sensory.toggleSound();
  }

  protected onChildSelected(child: ChildProfile): void {
    this.classroom.selectChild(child.id);
  }

  protected onTaskClicked(task: RoutineTask): void {
    this.routineStore.toggleTask(task.id);
  }

  protected trophyLabel(state: string): string {
    return this.i18n.translate(`childTrophy_${state}`);
  }

  protected taskLabel(task: RoutineTask): string {
    return this.i18n.translate(`childTask_${task.status}`);
  }
}
