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

  readonly completed = output<string>();
  readonly dismissed = output<void>();

  protected readonly percent = signal(3);
  protected readonly currentStageKey = signal('creationStageAlternatives');
  protected readonly stepNumber = signal(1);
  protected readonly totalSteps = signal(4);
  protected readonly isDone = signal(false);
  protected readonly isFailed = signal(false);

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

  protected readonly iconName = computed<'sparkle' | 'cube' | 'check' | 'close'>(() => {
    if (this.isDone()) return 'check';
    if (this.isFailed()) return 'close';
    return this.stepNumber() % 2 === 0 ? 'cube' : 'sparkle';
  });

  ngOnInit(): void {
    const name = this.modelName();
    const promptText = this.prompt();
    const imagesList = this.images();

    if (promptText) {
      void this.creationService.triggerGeneration({
        name,
        prompt: promptText,
        images: imagesList,
      });
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

      const elapsed = (Date.now() - (this.startedAt() ?? this.startTime)) / 1000;
      const simulated = this.calculateAsymptoticPercent(elapsed, EXPECTED_GENERATION_SECONDS);

      // Only allow simulation to increase percent
      if (simulated > this.percent()) {
        this.percent.set(Math.min(96, simulated));
      }

      const current = this.percent();
      if (current < 25) {
        this.currentStageKey.set('creationStageAlternatives');
        this.stepNumber.set(1);
      } else if (current < 55) {
        this.currentStageKey.set('creationStagePick');
        this.stepNumber.set(2);
      } else if (current < 80) {
        this.currentStageKey.set('creationStageMesh');
        this.stepNumber.set(3);
      } else if (current < 92) {
        this.currentStageKey.set('creationStageSheets');
        this.stepNumber.set(4);
      } else {
        this.currentStageKey.set('creationStageFinalizing');
        this.stepNumber.set(4);
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
      this.markCompleted();
      return;
    }

    if (progress.state === 'failed') {
      this.isFailed.set(true);
      this.currentStageKey.set('creationStageFailed');
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

  private markCompleted(): void {
    if (this.isDone()) return;
    this.isDone.set(true);
    this.percent.set(100);
    this.currentStageKey.set('creationStageDone');
    this.stepNumber.set(4);
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
