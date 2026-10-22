import { describe, expect, it } from 'vitest';
import { Sphere, Vector3 } from 'three';
import { OrbitCamera } from './orbit-camera';

describe('OrbitCamera', () => {
  it('frames sphere centered vertically on the figure center', () => {
    const orbit = new OrbitCamera();
    const sphere = new Sphere(new Vector3(0, 10, 0), 4);
    orbit.frameSphere(sphere);

    // Target y is centered vertically on sphere center
    expect(orbit['target'].y).toBeCloseTo(10);
    expect(orbit['target'].x).toBe(0);
    expect(orbit['target'].z).toBe(0);
  });

  it('adjusts distance on resize while maintaining vertical center target', () => {
    const orbit = new OrbitCamera();
    const sphere = new Sphere(new Vector3(2, 5, 1), 2);
    orbit.frameSphere(sphere);

    const initialDistance = orbit['distance'];
    orbit.resize(0.5);

    expect(orbit['distance']).toBeGreaterThan(initialDistance);
    expect(orbit['target'].y).toBeCloseTo(5);
  });

  it('orbits camera around optical center target', () => {
    const orbit = new OrbitCamera();
    const sphere = new Sphere(new Vector3(0, 0, 0), 2);
    orbit.frameSphere(sphere);

    const initialPos = orbit.camera.position.clone();
    orbit.orbit(10, 5);

    expect(orbit.camera.position.x).not.toBe(initialPos.x);
    expect(orbit['target'].y).toBeCloseTo(0);
  });

  it('resets to home orientation on home() call', () => {
    const orbit = new OrbitCamera();
    const sphere = new Sphere(new Vector3(0, 0, 0), 2);
    orbit.frameSphere(sphere);

    orbit.orbit(20, 20);
    orbit.scale(1.5);
    orbit.home();

    expect(orbit['zoom']).toBe(1);
    expect(orbit['target'].y).toBeCloseTo(0);
  });
});
