import {
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HandDrawnDirective } from 'ibid-ui';
import { I18nService } from '@ibid/services';
import {
  CreationProgress,
  CreationProgressService,
} from '@application/services/creation-progress.service';
import { PictogramComponent } from '@ui/atoms/pictogram/pictogram';

const STAGE_KEYS_BY_STEP: Readonly<Record<string, string>> = {
  's1-step-1': 'creationStageAlternatives',
  's1-step-2': 'creationStagePick',
  's2-step-1': 'creationStageCutout',
  's2-step-2': 'creationStageMesh',
  'stage-3': 'creationStagePlinth',
  's3-step-1': 'creationStagePlinth',
  'stage-4': 'creationStageSheets',
  's4-step-2': 'creationStageSheets',
};

const STEP_NUMBERS_BY_ID: Readonly<Record<string, number>> = {
  's1-step-1': 1,
  's1-step-2': 2,
  's2-step-1': 3,
  's2-step-2': 3,
  'stage-3': 4,
  's3-step-1': 4,
  'stage-4': 4,
  's4-step-2': 4,
};

const EXPECTED_GENERATION_SECONDS = 26;

@Component({
  selector: 'papikapi-model-creation-loader',
  standalone: true,
  imports: [CommonModule, HandDrawnDirective, PictogramComponent],
  templateUrl: './model-creation-loader.html',
  styleUrl: './model-creation-loader.scss',
})
export class ModelCreationLoaderComponent implements OnInit {
  protected readonly i18n = inject(I18nService);
  private readonly creationService = inject(CreationProgressService);
  private readonly destroyRef = inject(DestroyRef);

  readonly modelName = input.required<string>();
  readonly prompt = input<string>('');
  readonly images = input<readonly string[]>([]);
  readonly startedAt = input<number>();
  readonly phase = input<'alternatives' | 'mesh'>('alternatives');
  readonly pick = input<number | undefined>(undefined);

  readonly alternativesReady = output<{ readonly name: string; readonly sheetUrl: string }>();
  readonly completed = output<string>();
  readonly dismissed = output<void>();

  protected readonly percent = signal(3);
  protected readonly currentStageKey = signal('creationStageAlternatives');
  protected readonly stepNumber = signal(1);
  protected readonly totalSteps = signal(2);
  protected readonly isDone = signal(false);
  protected readonly isFailed = signal(false);
  protected readonly isQueued = signal(false);

  private timerId?: ReturnType<typeof setInterval>;
  private dismissTimerId?: ReturnType<typeof setTimeout>;
  private readonly startTime = Date.now();

  protected readonly percentLabel = computed(() => `${Math.round(this.percent())}%`);

  protected readonly stepTag = computed(() => {
    if (this.isDone()) return '✓';
    const template = this.i18n.translate('creationProgressBadge');
    return template
      .replace('{{current}}', String(this.stepNumber()))
      .replace('{{total}}', String(this.totalSteps()));
  });

  protected readonly iconName = computed<'sparkle' | 'cube' | 'check' | 'close' | 'hourglass'>(() => {
    if (this.isDone()) return 'check';
    if (this.isFailed()) return 'close';
    if (this.isQueued()) return 'hourglass';
    return this.stepNumber() % 2 === 0 ? 'cube' : 'sparkle';
  });

  ngOnInit(): void {
    const name = this.modelName();
    const promptText = this.prompt();
    const imagesList = this.images();
    const currentPhase = this.phase();

    if (currentPhase === 'mesh') {
      this.stepNumber.set(2);
      this.currentStageKey.set('creationStageMesh');
      void this.creationService
        .triggerPick({
          name,
          pick: this.pick() ?? 3,
        })
        .then((ok) => {
          if (!ok) {
            this.isFailed.set(true);
            this.currentStageKey.set('creationStageFailed');
          }
        });
    } else {
      this.stepNumber.set(1);
      this.currentStageKey.set('creationStageAlternatives');
      if (promptText) {
        void this.creationService
          .triggerGeneration({
            name,
            prompt: promptText,
            images: imagesList,
          })
          .then((ok) => {
            if (!ok) {
              this.isFailed.set(true);
              this.currentStageKey.set('creationStageFailed');
            }
          });
      }
    }

    const unsubscribe = this.creationService.connect(name, (progress) =>
      this.handleProgressUpdate(progress)
    );
    this.destroyRef.onDestroy(() => {
      unsubscribe();
      this.clearTimers();
    });

    this.startProgressSimulation();
  }

  private startProgressSimulation(): void {
    this.timerId = setInterval(() => {
      if (this.isDone() || this.isFailed()) {
        return;
      }

      if (this.isQueued()) {
        this.currentStageKey.set('creationStageQueue');
        return;
      }

      const elapsed = (Date.now() - (this.startedAt() ?? this.startTime)) / 1000;
      const simulated = this.calculateAsymptoticPercent(elapsed, EXPECTED_GENERATION_SECONDS);

      // Only allow simulation to increase percent
      if (simulated > this.percent()) {
        this.percent.set(Math.min(96, simulated));
      }

      const current = this.percent();
      if (this.phase() === 'mesh') {
        if (current < 45) {
          this.currentStageKey.set('creationStageMesh');
        } else if (current < 85) {
          this.currentStageKey.set('creationStageSheets');
        } else {
          this.currentStageKey.set('creationStageFinalizing');
        }
      } else {
        this.currentStageKey.set('creationStageAlternatives');
      }
    }, 200);
  }

  private calculateAsymptoticPercent(elapsedSeconds: number, expectedSeconds: number): number {
    const ratio = elapsedSeconds / Math.max(1, expectedSeconds);
    if (ratio <= 1) {
      return 88 * ratio;
    }
    const remaining = 98 - 88;
    return 88 + remaining * (1 - Math.exp(1 - ratio));
  }

  private handleProgressUpdate(progress: CreationProgress): void {
    if (progress.state === 'done') {
      if (this.phase() === 'alternatives') {
        this.markAlternativesReady();
      } else {
        this.markCompleted();
      }
      return;
    }

    if (progress.state === 'failed') {
      this.isFailed.set(true);
      this.currentStageKey.set('creationStageFailed');
      return;
    }

    const msg = (progress.message ?? '').toLowerCase();
    const queued =
      msg.includes('fila de espera') ||
      msg.includes('in_queue') ||
      msg.includes('waiting in queue');
    this.isQueued.set(queued);

    if (queued) {
      this.currentStageKey.set('creationStageQueue');
      return;
    }

    if (progress.stepId) {
      const stageKey = STAGE_KEYS_BY_STEP[progress.stepId];
      if (stageKey) {
        this.currentStageKey.set(stageKey);
      }
      const mappedStep = STEP_NUMBERS_BY_ID[progress.stepId];
      if (mappedStep) {
        this.stepNumber.set(mappedStep);
      }
    }

    if (progress.stepCount > 0 && progress.stepIndex !== undefined) {
      const stepBase = (progress.stepIndex / progress.stepCount) * 100;
      const calculated = Math.min(95, Math.max(this.percent(), stepBase));
      this.percent.set(calculated);
    }
  }

  private markAlternativesReady(): void {
    if (this.isDone()) return;
    this.isDone.set(true);
    this.percent.set(100);
    this.currentStageKey.set('creationStagePick');
    this.clearTimers();

    const name = this.modelName();
    this.dismissTimerId = setTimeout(() => {
      this.alternativesReady.emit({
        name,
        sheetUrl: this.creationService.sheetUrl(name),
      });
    }, 600);
  }

  private markCompleted(): void {
    if (this.isDone()) return;
    this.isDone.set(true);
    this.percent.set(100);
    this.currentStageKey.set('creationStageDone');
    this.stepNumber.set(2);
    this.clearTimers();

    this.dismissTimerId = setTimeout(() => {
      this.completed.emit(this.modelName());
    }, 2200);
  }

  protected dismiss(): void {
    this.clearTimers();
    this.dismissed.emit();
  }

  private clearTimers(): void {
    if (this.timerId !== undefined) {
      clearInterval(this.timerId);
      this.timerId = undefined;
    }
    if (this.dismissTimerId !== undefined) {
      clearTimeout(this.dismissTimerId);
      this.dismissTimerId = undefined;
    }
  }
}
