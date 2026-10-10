import { describe, expect, it } from 'vitest';
import { Sphere, Vector3 } from 'three';
import { OrbitCamera } from './orbit-camera';

describe('OrbitCamera', () => {
  it('frames sphere with downward target shift for optical centering', () => {
    const orbit = new OrbitCamera();
    const sphere = new Sphere(new Vector3(0, 10, 0), 4);
    orbit.frameSphere(sphere);

    // Target y should be shifted downward by 0.25 * radius (4 * 0.25 = 1)
    expect(orbit['target'].y).toBeCloseTo(9);
    expect(orbit['target'].x).toBe(0);
    expect(orbit['target'].z).toBe(0);
  });

  it('adjusts distance on resize while maintaining optical center target', () => {
    const orbit = new OrbitCamera();
    const sphere = new Sphere(new Vector3(2, 5, 1), 2);
    orbit.frameSphere(sphere);

    const initialDistance = orbit['distance'];
    orbit.resize(0.5);

    expect(orbit['distance']).toBeGreaterThan(initialDistance);
    expect(orbit['target'].y).toBeCloseTo(5 - 2 * 0.25);
  });

  it('orbits camera around optical center target', () => {
    const orbit = new OrbitCamera();
    const sphere = new Sphere(new Vector3(0, 0, 0), 2);
    orbit.frameSphere(sphere);

    const initialPos = orbit.camera.position.clone();
    orbit.orbit(10, 5);

    expect(orbit.camera.position.x).not.toBe(initialPos.x);
    expect(orbit['target'].y).toBeCloseTo(-0.5);
  });

  it('resets to home orientation on home() call', () => {
    const orbit = new OrbitCamera();
    const sphere = new Sphere(new Vector3(0, 0, 0), 2);
    orbit.frameSphere(sphere);

    orbit.orbit(20, 20);
    orbit.scale(1.5);
    orbit.home();

    expect(orbit['zoom']).toBe(1);
    expect(orbit['target'].y).toBeCloseTo(-0.5);
  });
});
