import { DoubleSide, Group, LineBasicMaterial, MeshLambertMaterial, Sphere } from 'three';
import { AssemblyPlan } from '@domain/assembly/assembly-plan';
import { focusWeight } from '@domain/assembly/assembly-timeline';
import {
  figureFootprint,
  horizonCell,
  horizonSlot,
  isOnHorizon,
} from '@domain/assembly/horizon-layout';
import { figureBounds } from './face-geometry';
import { PieceLabel } from './piece-label';
import { PieceRig } from './piece-rig';

const MM_TO_SCENE = 0.001;
const MIN_SHOT_SHARE = 0.22;
const LABEL_HEIGHT_MM = 70;
const LABEL_FADE_END = 0.2;

export class AssemblyRig {
  readonly root = new Group();

  private readonly solid = new MeshLambertMaterial({
    vertexColors: true,
    side: DoubleSide,
    flatShading: true,
  });
  private readonly wireframe = new LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  private readonly pieces: readonly PieceRig[];
  private readonly labels: readonly PieceLabel[];
  private readonly figure: Sphere;

  constructor(plan: AssemblyPlan, viewYaw: number) {
    const footprint = figureFootprint(plan);
    const cell = horizonCell(plan.pieces.map((piece) => piece.size));
    const slots = plan.pieces.map((_, index) => horizonSlot(index, footprint, cell, viewYaw));
    const bounds = figureBounds(plan.pieces.flatMap((piece) => piece.faces));
    const materials = { solid: this.solid, wireframe: this.wireframe };
    this.pieces = plan.pieces.map(
      (piece, index) => new PieceRig(piece, materials, slots[index], bounds),
    );
    this.labels = plan.pieces.map((piece) => new PieceLabel(String(piece.number)));
    const stage = new Group();
    stage.rotation.x = -Math.PI / 2;
    stage.scale.setScalar(MM_TO_SCENE);
    this.pieces.forEach((piece) => stage.add(piece.group));
    this.labels.forEach((label, index) => {
      const [x, y] = slots[index];
      label.sprite.position.set(x * MM_TO_SCENE, LABEL_HEIGHT_MM * MM_TO_SCENE, -y * MM_TO_SCENE);
      this.root.add(label.sprite);
    });
    this.root.add(stage);
    this.root.updateMatrixWorld(true);
    this.figure = this.measureFigure();
  }

  get pieceCount(): number {
    return this.pieces.length;
  }

  figureShot(): Sphere {
    return this.figure.clone();
  }

  showBuilt(built: number): void {
    this.pieces.forEach((piece, index) =>
      index < built ? piece.markBuilt() : piece.markWaiting(isOnHorizon(index, built)),
    );
    this.labels.forEach((label, index) => {
      label.sprite.visible = isOnHorizon(index, built);
      label.emphasise(index === built);
    });
  }

  showBuilding(built: number, build: number): void {
    this.pieces.forEach((piece, index) => {
      if (index < built) piece.markBuilt();
      else if (index === built) piece.markBuilding(build);
      else piece.markWaiting(isOnHorizon(index, built + 1));
    });
    this.labels.forEach((label, index) => {
      const queued = index > built && isOnHorizon(index, built + 1);
      label.sprite.visible = queued || (index === built && build < LABEL_FADE_END);
      label.emphasise(index === built);
    });
  }

  shot(built: number, build: number): Sphere {
    if (built >= this.pieces.length) return this.figureShot();
    const piece = this.closeUp(this.pieces[built].bounds());
    return this.blend(this.figureShot(), piece, focusWeight(build));
  }

  dispose(): void {
    this.pieces.forEach((piece) => piece.dispose());
    this.labels.forEach((label) => label.dispose());
    this.solid.dispose();
    this.wireframe.dispose();
  }

  private measureFigure(): Sphere {
    const [first, ...rest] = this.pieces.map((piece) => piece.placedBounds());
    return rest.reduce((union, sphere) => union.union(sphere), first.clone());
  }

  private closeUp(bounds: Sphere): Sphere {
    const radius = Math.max(bounds.radius, this.figure.radius * MIN_SHOT_SHARE);
    return new Sphere(bounds.center.clone(), radius);
  }

  private blend(from: Sphere, to: Sphere, weight: number): Sphere {
    return new Sphere(
      from.center.clone().lerp(to.center, weight),
      from.radius + (to.radius - from.radius) * weight,
    );
  }
}
