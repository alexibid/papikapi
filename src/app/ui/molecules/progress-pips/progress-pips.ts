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
  readonly isBase: boolean;
}

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

  protected readonly folds = computed((): readonly Fold[] => {
    const f = this.effectiveFilled();
    return Array.from({ length: this.total() }, (_, position) => ({
      index: position,
      filled: position < f,
      isBase: position === 0,
    }));
  });

  protected readonly progressRatio = computed(() => {
    const t = this.total();
    if (t <= 0) return 0;
    return Math.max(0, Math.min(1, this.effectiveFilled() / t));
  });

  // Color scale: Vermelho -> Laranja -> Amarelo -> Amarelo-Lima -> Verde quando completo
  protected readonly stripColor = computed(() => {
    const r = this.progressRatio();
    if (r <= 0) return 'hsl(4, 88%, 52%)'; // Vermelho
    if (r >= 1) return 'hsl(142, 74%, 42%)'; // Verde quando completo
    if (r <= 0.25) {
      const p = r / 0.25;
      const h = Math.round(4 + p * (26 - 4));
      return `hsl(${h}, 90%, 52%)`; // Vermelho a Laranja
    }
    if (r <= 0.5) {
      const p = (r - 0.25) / 0.25;
      const h = Math.round(26 + p * (54 - 26));
      return `hsl(${h}, 92%, 50%)`; // Laranja a Amarelo
    }
    if (r <= 0.75) {
      const p = (r - 0.5) / 0.25;
      const h = Math.round(54 + p * (84 - 54));
      return `hsl(${h}, 86%, 47%)`; // Amarelo a Amarelo-Lima
    }
    const p = (r - 0.75) / 0.25;
    const h = Math.round(84 + p * (142 - 84));
    return `hsl(${h}, 78%, 43%)`; // Amarelo-Lima a Verde
  });

  protected readonly stripHue = computed(() => {
    const r = this.progressRatio();
    return Math.round(4 + r * (142 - 4));
  });

  readonly stripWidth = computed(() => {
    const filled = this.effectiveFilled();
    const remaining = Math.max(0, this.total() - filled);
    const w = filled * 3.49 + remaining * 0.75;
    return `${w.toFixed(2)}rem`;
  });

  private worldAngle(index: number): number {
    const filled = this.effectiveFilled();
    const isOpen = index < filled;
    const mag = isOpen ? 14 : 78;
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
    const filled = this.effectiveFilled();
    const isOpen = index < filled;
    // Angled axes for organic tactile hand-folded look ("eixos mais angulados com alguma organicidade")
    // Alternating z-tilt and x-pitch so the cumulative deviation sums to zero ("sem fazer sair a barra do seu aspecto linear")
    const zTilt = isOpen ? (index % 2 === 0 ? 0.9 : -0.9) : (index % 2 === 0 ? 2.4 : -2.4);
    const xPitch = isOpen ? (index % 2 === 0 ? 0.6 : -0.6) : (index % 2 === 0 ? 1.8 : -1.8);
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
      const current = this.effectiveFilled();
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
