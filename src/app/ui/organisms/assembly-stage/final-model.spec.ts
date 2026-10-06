import { describe, expect, it } from 'vitest';
import { BoxGeometry, Box3, Group, Mesh, MeshBasicMaterial, Sphere, Vector3 } from 'three';
import { FinalModel } from './final-model';

function modelOf(size: number, at: Vector3): Group {
  const group = new Group();
  const mesh = new Mesh(new BoxGeometry(size, size, size), new MeshBasicMaterial());
  mesh.position.copy(at);
  group.add(mesh);
  return group;
}

function sphereOf(group: Group): Sphere {
  group.updateMatrixWorld(true);
  return new Box3().setFromObject(group).getBoundingSphere(new Sphere());
}

describe('FinalModel', () => {
  it('fits the loaded model onto the figure it stands in for', () => {
    const model = new FinalModel(modelOf(40, new Vector3(100, -30, 7)));
    const target = new Sphere(new Vector3(1, 2, 3), 0.5);

    model.alignTo(target);

    const placed = sphereOf(model.root);
    expect(placed.radius).toBeCloseTo(target.radius);
    expect(placed.center.distanceTo(target.center)).toBeCloseTo(0);
  });

  it('can be aligned again without drifting', () => {
    const model = new FinalModel(modelOf(10, new Vector3(5, 5, 5)));
    const target = new Sphere(new Vector3(0, 1, 0), 2);

    model.alignTo(target);
    model.alignTo(target);

    expect(sphereOf(model.root).radius).toBeCloseTo(target.radius);
  });

  it('is shown and hidden on demand', () => {
    const model = new FinalModel(modelOf(1, new Vector3()));

    model.show(false);
    expect(model.root.visible).toBe(false);
    model.show(true);
    expect(model.root.visible).toBe(true);
  });
});
