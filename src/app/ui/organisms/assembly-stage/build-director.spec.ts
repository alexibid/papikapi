import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Sphere } from 'three';
import { BuildDirector, BuildableFigure, BuildView } from './build-director';

const PIECES = 10;

function figure(): BuildableFigure & { built: number[]; building: number[][] } {
  const built: number[] = [];
  const building: number[][] = [];
  return {
    pieceCount: PIECES,
    built,
    building,
    figureShot: () => new Sphere(),
    shot: () => new Sphere(),
    showBuilt: (count) => built.push(count),
    showBuilding: (count, build) => building.push([count, build]),
  };
}

function view(): BuildView {
  return { camera: { frameSphere: vi.fn() }, fit: vi.fn(), draw: vi.fn(), renderNow: vi.fn() };
}

describe('BuildDirector', () => {
  beforeEach(() =>
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
  );
  afterEach(() => vi.useRealTimers());

  it('starts on the requested pieces, never below the plinth', () => {
    const shown = figure();

    const director = new BuildDirector(shown, view(), 0, vi.fn());

    expect(director.current).toBe(1);
    expect(shown.built).toEqual([1]);
  });

  it('never shows more pieces than the figure has', () => {
    expect(new BuildDirector(figure(), view(), 99, vi.fn()).current).toBe(PIECES);
  });

  it('builds one piece with an animation, then settles on it', () => {
    const onSettled = vi.fn();
    const shown = figure();
    const director = new BuildDirector(shown, view(), 3, onSettled);

    director.advanceTo(4);
    expect(shown.building).toEqual([]);
    vi.advanceTimersByTime(6000);

    expect(shown.building.length).toBeGreaterThan(0);
    expect(director.current).toBe(4);
    expect(onSettled).toHaveBeenCalledWith(4);
  });

  it('jumps straight to the earlier pieces and animates only the last one', () => {
    const shown = figure();
    const director = new BuildDirector(shown, view(), 1, vi.fn());

    director.advanceTo(6);

    expect(shown.built).toContain(5);
    vi.advanceTimersByTime(6000);
    expect(shown.building.every(([count]) => count === 5)).toBe(true);
    expect(director.current).toBe(6);
  });

  it('settles immediately when nothing new was earned', () => {
    const onSettled = vi.fn();
    const director = new BuildDirector(figure(), view(), 3, onSettled);

    director.advanceTo(3);

    expect(onSettled).toHaveBeenCalledWith(3);
  });

  it('shows the whole figure on demand without settling', () => {
    const onSettled = vi.fn();
    const shown = figure();
    const director = new BuildDirector(shown, view(), 3, onSettled);

    director.showComplete();

    expect(shown.built[shown.built.length - 1]).toBe(PIECES);
    expect(onSettled).not.toHaveBeenCalled();
  });

  it('stops animating when disposed', () => {
    const onSettled = vi.fn();
    const director = new BuildDirector(figure(), view(), 3, onSettled);

    director.advanceTo(4);
    director.dispose();
    vi.advanceTimersByTime(6000);

    expect(onSettled).not.toHaveBeenCalled();
  });

  it('replays the last piece built and returns to where it was', () => {
    const onSettled = vi.fn();
    const shown = figure();
    const director = new BuildDirector(shown, view(), 4, onSettled);

    director.replay();
    vi.advanceTimersByTime(6000);

    expect(shown.building.length).toBeGreaterThan(0);
    expect(shown.building.every(([count]) => count === 3)).toBe(true);
    expect(director.current).toBe(4);
    expect(onSettled).not.toHaveBeenCalled();
  });

  it('previews the first piece when only the plinth is built, then returns to the plinth', () => {
    const shown = figure();
    const director = new BuildDirector(shown, view(), 1, vi.fn());

    director.replay();
    vi.advanceTimersByTime(6000);

    expect(shown.building.every(([count]) => count === 1)).toBe(true);
    expect(director.current).toBe(1);
  });

  it('animates all pieces sequentially to the end without settling points', () => {
    const onSettled = vi.fn();
    const shown = figure();
    const director = new BuildDirector(shown, view(), 2, onSettled);

    director.playToEnd(1000);
    vi.advanceTimersByTime(9000);

    expect(director.current).toBe(PIECES);
    expect(shown.built[shown.built.length - 1]).toBe(PIECES);
    expect(onSettled).not.toHaveBeenCalled();
  });
});
