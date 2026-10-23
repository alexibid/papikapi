import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_FIGURE_ID } from '@domain/data/shipped-figures';
import { pointsReducer } from '@application/state/points.reducer';
import { ChildPointsStore } from './child-points-store';

describe('ChildPointsStore (NgRx Store + Signals)', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideStore({ points: pointsReducer })],
    });
  });

  it('initializes with default figure and zero points when storage is empty', () => {
    const store = TestBed.inject(ChildPointsStore);

    expect(store.currentFigureId()).toBe(DEFAULT_FIGURE_ID);
    expect(store.unassignedCredits()).toBe(0);
    expect(store.consolidatingProgress()).toBe(0);
    expect(store.mountedFigureIds()).toEqual([]);
    expect(store.allocationFor(DEFAULT_FIGURE_ID)).toBe(0);
  });

  it('syncs raw points and calculates consolidation and consolidating ring progress', () => {
    const store = TestBed.inject(ChildPointsStore);

    // 25 raw points = 2 consolidated pieces + 5 consolidating progress
    store.syncRawPoints(25);

    expect(store.consolidatedPoints()).toBe(2);
    expect(store.consolidatingProgress()).toBe(5);
    expect(store.allocationFor(DEFAULT_FIGURE_ID)).toBe(2);
  });

  it('allocates credit and reclaims points correctly', () => {
    const store = TestBed.inject(ChildPointsStore);

    store.setUnassignedCredit(3);
    expect(store.unassignedCredits()).toBe(3);

    store.allocatePoint(DEFAULT_FIGURE_ID);
    expect(store.unassignedCredits()).toBe(2);
    expect(store.allocationFor(DEFAULT_FIGURE_ID)).toBe(1);

    store.reclaimPoint(DEFAULT_FIGURE_ID);
    expect(store.unassignedCredits()).toBe(3);
    expect(store.allocationFor(DEFAULT_FIGURE_ID)).toBe(0);
  });

  it('preserves individual figure allocations and does not mark incomplete figures as mounted when switching', () => {
    const store = TestBed.inject(ChildPointsStore);

    // Select pug and give it 30 points
    store.chooseFigure('pug');
    expect(store.currentFigureId()).toBe('pug');

    store.syncRawPoints(30);
    expect(store.allocationFor('pug')).toBe(3);

    // Switch to brachiosaurus (has 0 points)
    store.chooseFigure('brachiosaurus');
    expect(store.currentFigureId()).toBe('brachiosaurus');
    expect(store.allocationFor('brachiosaurus')).toBe(0);
    expect(store.isCurrentMounted()).toBe(false);

    // Pug should still retain its 3 points
    expect(store.allocationFor('pug')).toBe(3);

    // Switching back to pug restores its active progress
    store.chooseFigure('pug');
    expect(store.currentFigureId()).toBe('pug');
    expect(store.allocationFor('pug')).toBe(3);
  });

  it('mounts current figure and transitions cleanly', () => {
    const store = TestBed.inject(ChildPointsStore);

    expect(store.mountedFigureIds()).not.toContain(DEFAULT_FIGURE_ID);
    store.mountCurrentFigure();

    expect(store.mountedFigureIds()).toContain(DEFAULT_FIGURE_ID);
    expect(store.isCurrentMounted()).toBe(false);
  });

  it('computes 4-fold progress pips correctly', () => {
    const store = TestBed.inject(ChildPointsStore);

    // When figure has 0 allocation, figurePipsFilled is 0
    expect(store.figurePipsFilled()).toBe(0);

    // When figure has points allocated
    store.syncRawPoints(50);
    expect(store.figurePipsFilled()).toBeGreaterThan(0);
    expect(store.figurePipsFilled()).toBeLessThanOrEqual(4);
  });
});
