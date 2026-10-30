import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { HandDrawnDirective } from 'ibid-ui';
import { PictogramComponent } from '@ui/atoms/pictogram/pictogram';

interface Fold {
  readonly index: number;
  readonly filled: boolean;
  readonly openRatio: number;
  readonly isBase: boolean;
}

const FOLD_COUNT = 4;

interface ConfettiPiece {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly rotX: number;
  readonly rotY: number;
  readonly rotZ: number;
  readonly color: string;
  readonly shape: 'rect' | 'triangle' | 'strip';
  readonly size: number;
  readonly delayMs: number;
}

interface ConfettiBurst {
  readonly burstId: number;
  readonly segmentIndex: number;
  readonly pieces: readonly ConfettiPiece[];
}

const CONFETTI_COLORS: readonly string[] = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#ffd166',
  '#06d6a0',
  '#118ab2',
];

const SHAPES: readonly ('rect' | 'triangle' | 'strip')[] = ['rect', 'triangle', 'strip'];

@Component({
  selector: 'papikapi-progress-pips',
  standalone: true,
  imports: [HandDrawnDirective, PictogramComponent, NgTemplateOutlet],
  templateUrl: './progress-pips.html',
  styleUrl: './progress-pips.scss',
})
export class ProgressPipsComponent {
  readonly total = input.required<number>();
  readonly filled = input.required<number>();
  readonly ariaLabel = input('');

  private readonly destroyRef = inject(DestroyRef);
  private readonly timeouts = new Set<ReturnType<typeof setTimeout>>();
  private previousFilled = -1;
  private nextBurstId = 0;
  private peekTimeout?: ReturnType<typeof setTimeout>;
  private confettiTimeout?: ReturnType<typeof setTimeout>;

  readonly isPeeking = signal(false);
  private readonly testFilledOverride = signal<number>(-1);

  get testFilled(): number {
    return this.testFilledOverride() >= 0 ? this.testFilledOverride() : this.effectiveFilled();
  }
  set testFilled(val: number) {
    this.testFilledOverride.set(Number(val));
  }

  protected readonly bursts = signal<readonly ConfettiBurst[]>([]);
  protected readonly buttonBursts = signal<readonly ConfettiBurst[]>([]);

  readonly effectiveFilled = computed(() => {
    if (this.testFilledOverride() >= 0) {
      return Math.max(0, Math.min(this.total(), this.testFilledOverride()));
    }
    return this.isPeeking() ? this.total() : this.filled();
  });

  protected readonly progressRatio = computed(() => {
    const t = this.total();
    if (t <= 0) return 0;
    return Math.max(0, Math.min(1, this.effectiveFilled() / t));
  });

  protected readonly unfoldedFolds = computed(() => this.progressRatio() * FOLD_COUNT);

  protected readonly folds = computed((): readonly Fold[] => {
    const openFolds = this.unfoldedFolds();
    const isComplete = this.progressRatio() >= 1;
    return Array.from({ length: FOLD_COUNT }, (_, position) => {
      const openRatio = Math.max(0, Math.min(1, openFolds - position));
      const isLastFold = position === FOLD_COUNT - 1;
      return {
        index: position,
        filled: isLastFold ? isComplete : openRatio > 0,
        openRatio: isLastFold && !isComplete ? Math.min(0.65, openRatio) : openRatio,
        isBase: position === 0,
      };
    });
  });

  protected readonly stripColor = computed(() => {
    const r = this.progressRatio();
    if (r <= 0) return 'hsl(4, 88%, 52%)';
    if (r >= 1) return 'hsl(142, 74%, 42%)';
    if (r < 0.35) {
      const p = r / 0.35;
      const h = Math.round(4 + p * (26 - 4));
      return `hsl(${h}, 90%, 52%)`;
    }
    if (r < 0.70) {
      const p = (r - 0.35) / 0.35;
      const h = Math.round(26 + p * (50 - 26));
      return `hsl(${h}, 92%, 50%)`;
    }
    if (r < 0.90) {
      const p = (r - 0.70) / 0.20;
      const h = Math.round(50 + p * (60 - 50));
      return `hsl(${h}, 88%, 48%)`;
    }
    const p = (r - 0.90) / 0.10;
    const h = Math.round(60 + p * (142 - 60));
    return `hsl(${h}, 78%, 43%)`;
  });

  protected readonly stripHue = computed(() => {
    const r = this.progressRatio();
    if (r < 0.90) {
      return Math.round(4 + (r / 0.90) * (60 - 4));
    }
    const p = (r - 0.90) / 0.10;
    return Math.round(60 + p * (142 - 60));
  });

  readonly stripWidth = computed(() => {
    const openFolds = this.unfoldedFolds();
    const remaining = Math.max(0, FOLD_COUNT - openFolds);
    const w = openFolds * 3.49 + remaining * 0.75;
    return `${w.toFixed(2)}rem`;
  });

  private foldOpenRatio(index: number): number {
    return Math.max(0, Math.min(1, this.unfoldedFolds() - index));
  }

  private worldAngle(index: number): number {
    const openRatio = this.foldOpenRatio(index);
    const mag = 78 - openRatio * (78 - 14);
    return index % 2 === 0 ? -mag : mag;
  }

  foldAngle(index: number): number {
    if (index === 0) {
      return this.worldAngle(0);
    }
    return this.worldAngle(index) - this.worldAngle(index - 1);
  }

  foldTransform(index: number): string {
    const yAngle = this.foldAngle(index);
    const openRatio = this.foldOpenRatio(index);
    const zMag = 2.4 - openRatio * (2.4 - 0.9);
    const xMag = 1.8 - openRatio * (1.8 - 0.6);
    const zTilt = index % 2 === 0 ? zMag : -zMag;
    const xPitch = index % 2 === 0 ? xMag : -xMag;
    return `rotateY(${yAngle}deg) rotateZ(${zTilt}deg) rotateX(${xPitch}deg)`;
  }

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.peekTimeout) clearTimeout(this.peekTimeout);
      if (this.confettiTimeout) clearTimeout(this.confettiTimeout);
      for (const t of this.timeouts) {
        clearTimeout(t);
      }
      this.timeouts.clear();
    });

    effect(() => {
      const current = Math.ceil(this.unfoldedFolds());
      const prev = this.previousFilled;
      this.previousFilled = current;

      if (prev !== -1 && current > prev && !this.isPeeking()) {
        untracked(() => {
          for (let i = prev; i < current; i++) {
            this.spawnConfetti(i);
          }
        });
      }
    });
  }

  openPeek(): void {
    if (this.peekTimeout) clearTimeout(this.peekTimeout);
    if (this.confettiTimeout) clearTimeout(this.confettiTimeout);
    this.isPeeking.set(true);

    // The sheet unfolds slowly over ~2.4s. At the end of the opening,
    // release paper confetti originating from the button at the top-right corner of the sheet.
    this.confettiTimeout = setTimeout(() => {
      this.spawnButtonConfetti();
      this.confettiTimeout = undefined;
    }, 2400);

    this.peekTimeout = setTimeout(() => {
      this.isPeeking.set(false);
      this.peekTimeout = undefined;
    }, 10000); // Automatically returns to previous state after 10 seconds
  }

  protected burstsFor(segmentIndex: number): readonly ConfettiBurst[] {
    return this.bursts().filter((b) => b.segmentIndex === segmentIndex);
  }

  private spawnConfetti(segmentIndex: number): void {
    const burstId = ++this.nextBurstId;
    const pieces: ConfettiPiece[] = Array.from({ length: 16 }, (_, i) => ({
      id: burstId * 100 + i,
      x: (Math.random() - 0.5) * 90,
      y: -40 - Math.random() * 60,
      rotX: Math.random() * 720 - 360,
      rotY: Math.random() * 720 - 360,
      rotZ: Math.random() * 360,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      size: 6 + Math.random() * 5,
      delayMs: Math.random() * 60,
    }));

    const burst: ConfettiBurst = { burstId, segmentIndex, pieces };
    this.bursts.update((list) => [...list, burst]);

    const timer = setTimeout(() => {
      this.timeouts.delete(timer);
      this.bursts.update((list) => list.filter((b) => b.burstId !== burstId));
    }, 1200);
    this.timeouts.add(timer);
  }

  private spawnButtonConfetti(): void {
    const burstId = ++this.nextBurstId;
    const pieces: ConfettiPiece[] = Array.from({ length: 24 }, (_, i) => ({
      id: burstId * 100 + i,
      x: -180 + Math.random() * 220,
      y: -50 - Math.random() * 80,
      rotX: Math.random() * 720 - 360,
      rotY: Math.random() * 720 - 360,
      rotZ: Math.random() * 360,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      size: 7 + Math.random() * 6,
      delayMs: Math.random() * 80,
    }));

    const burst: ConfettiBurst = { burstId, segmentIndex: -1, pieces };
    this.buttonBursts.update((list) => [...list, burst]);

    const timer = setTimeout(() => {
      this.timeouts.delete(timer);
      this.buttonBursts.update((list) => list.filter((b) => b.burstId !== burstId));
    }, 1400);
    this.timeouts.add(timer);
  }
}
