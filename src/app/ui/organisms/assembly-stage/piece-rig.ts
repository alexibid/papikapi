import { Box3, Group, Material, Matrix4, Mesh, Object3D, Quaternion, Sphere, Vector3 } from 'three';
import {
  AssemblyFace,
  AssemblyPiece,
  FoldHinge,
  PlacedPose,
  Vec2,
} from '@domain/assembly/assembly-plan';
import { faceFold, pieceMotion } from '@domain/assembly/assembly-timeline';
import { HORIZON_SCALE } from '@domain/assembly/horizon-layout';
import { flatGeometry, solidGeometry } from './face-geometry';

const LIFT_MM = 110;
const ARC_MM = 70;
const WHOLE_SLICE = { progressStart: 0, progressEnd: 1 } as const;

interface FaceNode {
  readonly face: AssemblyFace;
  readonly node: Object3D;
}

export interface PieceMaterials {
  readonly solid: Material;
  readonly ghost: Material;
}

export class PieceRig {
  readonly group = new Group();

  private readonly folding = new Group();
  private readonly finished = new Group();
  private readonly ghost = new Group();
  private readonly nodes: readonly FaceNode[];
  private readonly maxDepth: number;
  private readonly start: Vec2;

  constructor(
    piece: AssemblyPiece,
    materials: PieceMaterials,
    slot: Vec2,
  ) {
    this.start = [slot[0] - piece.size[0] / 2, slot[1] - piece.size[1] / 2];
    this.nodes = piece.faces.map((face) => ({ face, node: new Object3D() }));
    this.maxDepth = Math.max(...piece.faces.map((face) => face.depth));
    this.nodes.forEach(({ face, node }) => {
      node.matrixAutoUpdate = false;
      node.add(new Mesh(flatGeometry(face), materials.solid));
      (face.parent < 0 ? this.folding : this.nodes[face.parent].node).add(node);
      const solid = solidGeometry(face);
      this.finished.add(new Mesh(solid, materials.solid));
      this.ghost.add(new Mesh(solid, materials.ghost));
    });
    this.group.add(this.folding, this.finished, this.ghost);
  }

  markBuilt(): void {
    this.show({ folding: false, finished: true, ghost: false });
  }

  markWaiting(onHorizon: boolean): void {
    this.show({ folding: onHorizon, finished: false, ghost: true });
    this.pose(0, 0);
  }

  markBuilding(build: number): void {
    const motion = pieceMotion(WHOLE_SLICE, build);
    this.show({ folding: !motion.arrived, finished: motion.arrived, ghost: !motion.arrived });
    if (!motion.arrived) {
      this.pose(motion.fold, motion.travel);
    }
  }

  bounds(): Sphere {
    this.group.updateWorldMatrix(true, true);
    const visible = this.finished.visible ? this.finished : this.folding;
    return new Box3().setFromObject(visible).getBoundingSphere(new Sphere());
  }

  placedBounds(): Sphere {
    this.markBuilt();
    return this.bounds();
  }

  dispose(): void {
    this.group.traverse((node) => {
      if (node instanceof Mesh) {
        node.geometry.dispose();
      }
    });
  }

  private show(visibility: { folding: boolean; finished: boolean; ghost: boolean }): void {
    this.folding.visible = visibility.folding;
    this.finished.visible = visibility.finished;
    this.ghost.visible = visibility.ghost;
  }

  private pose(fold: number, travel: number): void {
    this.nodes.forEach(({ face, node }) => {
      node.matrix.copy(this.localMatrix(face, fold, travel));
      node.matrixWorldNeedsUpdate = true;
    });
  }

  private localMatrix(face: AssemblyFace, fold: number, travel: number): Matrix4 {
    if (face.hinge !== undefined) {
      return this.hingeMatrix(face.hinge, face.depth, fold);
    }
    if (face.pose !== undefined) {
      return this.placement(face.pose, fold, travel);
    }
    throw new Error(`Face ${face.id} has neither a hinge nor a pose`);
  }

  private hingeMatrix(hinge: FoldHinge, depth: number, fold: number): Matrix4 {
    const { a, b, angleRad } = hinge;
    const axis = new Vector3(b[0] - a[0], b[1] - a[1], 0).normalize();
    const angle = angleRad * faceFold(fold, depth, this.maxDepth);
    return new Matrix4()
      .makeTranslation(a[0], a[1], 0)
      .multiply(new Matrix4().makeRotationAxis(axis, angle))
      .multiply(new Matrix4().makeTranslation(-a[0], -a[1], 0));
  }

  private placement(pose: PlacedPose, fold: number, travel: number): Matrix4 {
    const start = new Vector3(this.start[0], this.start[1], LIFT_MM * fold);
    const position = start.lerp(new Vector3(...pose.position), travel);
    position.z += ARC_MM * Math.sin(Math.PI * travel);
    const rotation = new Quaternion().slerp(new Quaternion(...pose.quaternion), travel);
    const size = HORIZON_SCALE + (1 - HORIZON_SCALE) * fold;
    return new Matrix4().compose(position, rotation, new Vector3(size, size, size));
  }
}
