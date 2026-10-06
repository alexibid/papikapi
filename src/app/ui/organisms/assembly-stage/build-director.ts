import { Sphere } from 'three';
import { PLINTH_PIECES } from '@domain/models/rhythm';
import { BuildAnimation } from './build-animation';

const BUILD_MS = 5200;

export interface BuildableFigure {
  readonly pieceCount: number;
  figureShot(): Sphere;
  showBuilt(built: number): void;
  showBuilding(built: number, build: number): void;
  shot(built: number, build: number): Sphere;
}

export interface BuildView {
  readonly camera: { frameSphere(sphere: Sphere): void };
  fit(): void;
  draw(): void;
  renderNow(): void;
}

export class BuildDirector {
  private shown: number;
  private readonly animation = new BuildAnimation(BUILD_MS);

  constructor(
    private readonly rig: BuildableFigure,
    private readonly viewport: BuildView,
    requested: number,
    private readonly onSettled: (built: number) => void
  ) {
    this.shown = this.clamp(requested);
    rig.showBuilt(this.shown);
    viewport.camera.frameSphere(rig.figureShot());
    viewport.fit();
  }

  get pieceCount(): number {
    return this.rig.pieceCount;
  }

  get current(): number {
    return this.shown;
  }

  advanceTo(requested: number): void {
    const built = this.clamp(requested);
    this.animation.stop();
    if (built > this.shown) {
      this.settleAt(built - 1);
      this.animate(built - 1, () => this.rest(built));
      return;
    }
    this.rest(built);
  }

  replay(): void {
    if (this.rig.pieceCount <= PLINTH_PIECES) return;
    this.animation.stop();
    const resting = this.shown;
    const target = Math.max(resting, PLINTH_PIECES + 1);
    this.settleAt(target - 1);
    this.animate(target - 1, () => this.settleAt(resting));
  }

  showComplete(): void {
    this.animation.stop();
    this.rig.showBuilt(this.rig.pieceCount);
    this.viewport.camera.frameSphere(this.rig.figureShot());
    this.viewport.draw();
  }

  dispose(): void {
    this.animation.stop();
  }

  private animate(from: number, onFinish: () => void): void {
    this.animation.run((build) => {
      this.rig.showBuilding(from, build);
      this.viewport.camera.frameSphere(this.rig.shot(from, build));
      this.viewport.renderNow();
    }, onFinish);
  }

  private rest(built: number): void {
    this.settleAt(built);
    this.onSettled(built);
  }

  private settleAt(built: number): void {
    this.shown = built;
    this.rig.showBuilt(built);
    this.viewport.camera.frameSphere(this.rig.figureShot());
    this.viewport.draw();
  }

  private clamp(built: number): number {
    return Math.min(this.rig.pieceCount, Math.max(PLINTH_PIECES, Math.floor(built)));
  }
}
