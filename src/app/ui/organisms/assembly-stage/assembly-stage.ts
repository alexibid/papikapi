import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { HandDrawnDirective, IconButtonComponent } from 'ibid-ui';
import { PLINTH_PIECES } from '@domain/models/rhythm';
import { PictogramComponent } from '@ui/atoms/pictogram/pictogram';
import { StickerComponent } from '@ui/atoms/sticker/sticker';
import { BalloonBunchComponent } from '../balloon-bunch/balloon-bunch';
import { AssemblyPlanService } from '@application/services/assembly-plan.service';
import { AssemblyRig } from './assembly-rig';
import { FINAL_MODEL_LOADER } from './final-model-loader';
import { FinalModel } from './final-model';
import { BuildDirector } from './build-director';
import { HOME_YAW } from './orbit-camera';
import { RENDERER_FACTORY } from './renderer-factory';
import { StageViewport } from './stage-viewport';

export type StageMode = 'animated' | 'complete' | 'play-all';

const WHEEL_ZOOM_OUT = 0.9;
const WHEEL_ZOOM_IN = 1.1;

@Component({
  selector: 'papikapi-assembly-stage',
  standalone: true,
  imports: [
    BalloonBunchComponent,
    HandDrawnDirective,
    IconButtonComponent,
    PictogramComponent,
    StickerComponent,
  ],
  host: {
    '(window:scroll)': 'deactivate()',
    '[class.is-active]': 'active()',
  },
  templateUrl: './assembly-stage.html',
  styleUrl: './assembly-stage.scss',
})
export class AssemblyStageComponent implements AfterViewInit, OnDestroy {
  readonly source = input.required<string>();
  readonly modelSource = input('');
  readonly built = input(PLINTH_PIECES);
  readonly loading = input(false);
  readonly ariaLabel = input('');
  readonly releaseLabel = input('');
  readonly completeLabel = input('');
  readonly animatedLabel = input('');
  readonly animateToEndLabel = input('');
  readonly ready = output<number>();
  readonly settled = output<number>();
  readonly failed = output<string>();

  protected readonly active = signal(false);
  protected readonly mode = signal<StageMode>('animated');
  protected readonly replays = signal(0);
  protected readonly playAllRequests = signal(0);

  private readonly plans = inject(AssemblyPlanService);
  private readonly createRenderer = inject(RENDERER_FACTORY);
  private readonly loadFinalModel = inject(FINAL_MODEL_LOADER);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('webglCanvas');
  private readonly containerRef = viewChild.required<ElementRef<HTMLElement>>('container');

  private viewport?: StageViewport;
  private rig?: AssemblyRig;
  private director?: BuildDirector;
  private finalModel?: Promise<FinalModel | undefined>;
  private lastReplay = 0;
  private lastPlayAll = 0;
  private dragging = false;
  private lastPointer = { x: 0, y: 0 };

  constructor() {
    effect(() => {
      const url = this.source();
      if (this.viewport) void this.load(url);
    });
    effect(() => {
      const built = this.built();
      const mode = this.mode();
      const replays = this.replays();
      const playAlls = this.playAllRequests();
      const isLoading = this.loading();
      if (!this.director) return;
      if (isLoading) {
        this.director.loopAssembly(850);
        return;
      }
      this.director.stopLoop();
      const replayRequested = replays !== this.lastReplay;
      const playAllRequested = playAlls !== this.lastPlayAll;
      this.lastReplay = replays;
      this.lastPlayAll = playAlls;
      if (mode === 'complete') {
        this.director.showComplete();
        void this.revealFinalModel();
        return;
      }
      void this.hideFinalModel();
      if (mode === 'play-all' && playAllRequested) {
        this.director.playToEnd(1200, () => this.mode.set('complete'));
        return;
      }
      if (replayRequested) this.director.replay();
      else this.director.advanceTo(built);
    });
  }

  ngAfterViewInit(): void {
    this.viewport = new StageViewport(
      this.createRenderer,
      this.canvasRef().nativeElement,
      this.containerRef().nativeElement
    );
    void this.load(this.source());
  }

  ngOnDestroy(): void {
    this.discardFigure();
    this.viewport?.dispose();
  }

  protected onPointerDown(event: PointerEvent): void {
    if (!this.active()) {
      this.active.set(true);
      return;
    }
    this.dragging = true;
    this.lastPointer = { x: event.clientX, y: event.clientY };
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.dragging || !this.viewport) return;
    this.viewport.camera.orbit(event.clientX - this.lastPointer.x, event.clientY - this.lastPointer.y);
    this.lastPointer = { x: event.clientX, y: event.clientY };
    this.viewport.draw();
  }

  protected onPointerUp(): void {
    this.dragging = false;
  }

  protected onWheel(event: WheelEvent): void {
    if (!this.active() || !this.viewport) return;
    event.preventDefault();
    this.viewport.camera.scale(event.deltaY > 0 ? WHEEL_ZOOM_OUT : WHEEL_ZOOM_IN);
    this.viewport.draw();
  }

  protected showComplete(): void {
    this.mode.set('complete');
  }

  protected showAnimated(): void {
    this.mode.set('animated');
    this.replays.update((count) => count + 1);
  }

  protected showPlayAll(): void {
    this.mode.set('play-all');
    this.playAllRequests.update((count) => count + 1);
  }

  protected deactivate(): void {
    this.active.set(false);
    this.dragging = false;
  }

  private async load(url: string): Promise<void> {
    this.mode.set('animated');
    this.discardFigure();
    if (!url || !this.viewport) return;
    try {
      const rig = new AssemblyRig(await this.plans.load(url), HOME_YAW);
      this.viewport.scene.add(rig.root);
      this.rig = rig;
      this.director = new BuildDirector(rig, this.viewport, this.built(), (built) =>
        this.settled.emit(built)
      );
      if (this.loading()) {
        this.director.loopAssembly(850);
      }
      this.ready.emit(this.director.pieceCount);
      this.settled.emit(this.director.current);
    } catch {
      this.discardFigure();
      this.failed.emit(url);
    }
  }

  private async revealFinalModel(): Promise<void> {
    const model = await this.ensureFinalModel();
    if (!model || !this.rig || this.mode() !== 'complete') return;
    this.rig.root.visible = false;
    model.show(true);
    this.viewport?.draw();
  }

  private async hideFinalModel(): Promise<void> {
    if (this.rig) this.rig.root.visible = true;
    const model = await this.finalModel;
    model?.show(false);
    this.viewport?.draw();
  }

  private ensureFinalModel(): Promise<FinalModel | undefined> {
    const rig = this.rig;
    const url = this.modelSource() || this.source().replace(/assembly\.json(\?.*)?$/, 'model.glb$1');
    if (!rig || !url) return Promise.resolve(undefined);
    this.finalModel ??= this.loadFinalModel(url)
      .then((group) => {
        const model = new FinalModel(group);
        model.alignTo(rig.figureShot());
        model.show(false);
        this.viewport?.scene.add(group);
        return model;
      })
      .catch(() => undefined);
    return this.finalModel;
  }

  private discardFinalModel(): void {
    const loading = this.finalModel;
    this.finalModel = undefined;
    void loading?.then((model) => {
      if (!model) return;
      this.viewport?.scene.remove(model.root);
      model.dispose();
    });
  }

  private discardFigure(): void {
    this.discardFinalModel();
    this.director?.dispose();
    this.director = undefined;
    if (!this.rig) return;
    this.viewport?.scene.remove(this.rig.root);
    this.rig.dispose();
    this.rig = undefined;
  }
}
