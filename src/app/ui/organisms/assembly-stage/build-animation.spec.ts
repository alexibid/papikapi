import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BuildAnimation } from './build-animation';

const DURATION = 1000;

describe('BuildAnimation', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] }));
  afterEach(() => vi.useRealTimers());

  it('reports growing progress and finishes once at the end', () => {
    const progress: number[] = [];
    const onFinish = vi.fn();

    new BuildAnimation(DURATION).run((value) => progress.push(value), onFinish);
    vi.advanceTimersByTime(DURATION + 100);

    expect(progress[progress.length - 1]).toBe(1);
    expect([...progress].sort((a, b) => a - b)).toEqual(progress);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('stops without finishing when asked to', () => {
    const onFinish = vi.fn();
    const animation = new BuildAnimation(DURATION);

    animation.run(() => undefined, onFinish);
    vi.advanceTimersByTime(DURATION / 2);
    animation.stop();
    vi.advanceTimersByTime(DURATION);

    expect(onFinish).not.toHaveBeenCalled();
  });

  it('replaces a running animation when run again', () => {
    const first = vi.fn();
    const second = vi.fn();
    const animation = new BuildAnimation(DURATION);

    animation.run(() => undefined, first);
    animation.run(() => undefined, second);
    vi.advanceTimersByTime(DURATION + 100);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
