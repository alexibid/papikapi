import { TestBed } from '@angular/core/testing';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CHILD_ID } from '@application/config/child';
import { ChildProfilesStore } from '@application/services/child-profiles-store';
import { DEFAULT_FIGURE_ID } from '@domain/data/shipped-figures';
import { createTreeState } from '@domain/models/tree-state';
import { PapikapiDatabaseService } from '@infrastructure/rxdb/papikapi-database.service';
import { RxdbTreeRepository } from '@infrastructure/rxdb/rxdb-tree.repository';
import { PointsEffects } from './points.effects';
import { CHILD_POINTS_FACADE, ChildPointsFacade } from './points.facade';
import { pointsReducer } from './points.reducer';
import { STORAGE_KEY, figureProgressKey } from './points.state';

describe('NgRx Points State & RxDB Integration', () => {
  let facade: ChildPointsFacade;
  let treeRepo: RxdbTreeRepository;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideStore({ points: pointsReducer }),
        provideEffects([PointsEffects]),
      ],
    });

    facade = TestBed.inject(CHILD_POINTS_FACADE);
    treeRepo = TestBed.inject(RxdbTreeRepository);
  });

  afterEach(async () => {
    await TestBed.inject(PapikapiDatabaseService).close();
  });

  it('initializes with default state via NgRx reducer and selectors', () => {
    expect(facade.currentFigureId()).toBe(DEFAULT_FIGURE_ID);
    expect(facade.rawPoints()).toBe(0);
    expect(facade.consolidatedPoints()).toBe(0);
    expect(facade.unassignedCredits()).toBe(0);
    expect(facade.isCurrentMounted()).toBe(false);
  });

  it('dispatches syncRawPoints and recomputes signals from selectors', () => {
    facade.syncRawPoints(35);

    expect(facade.rawPoints()).toBe(35);
    expect(facade.consolidatedPoints()).toBe(3);
    expect(facade.consolidatingProgress()).toBe(5);
    expect(facade.allocationFor(DEFAULT_FIGURE_ID)).toBe(3);
  });

  it('allocates and reclaims points modifying the credit bank', () => {
    facade.setUnassignedCredit(4);
    expect(facade.unassignedCredits()).toBe(4);

    facade.allocatePoint(DEFAULT_FIGURE_ID);
    expect(facade.unassignedCredits()).toBe(3);
    expect(facade.allocationFor(DEFAULT_FIGURE_ID)).toBe(1);

    facade.reclaimPoint(DEFAULT_FIGURE_ID);
    expect(facade.unassignedCredits()).toBe(4);
    expect(facade.allocationFor(DEFAULT_FIGURE_ID)).toBe(0);
  });

  it('preserves individual figure allocations across figure selection', () => {
    facade.chooseFigure('pug');
    expect(facade.currentFigureId()).toBe('pug');

    facade.syncRawPoints(30);
    expect(facade.allocationFor('pug')).toBe(3);

    facade.chooseFigure('brachiosaurus');
    expect(facade.currentFigureId()).toBe('brachiosaurus');
    expect(facade.allocationFor('brachiosaurus')).toBe(0);
    expect(facade.allocationFor('pug')).toBe(3);

    facade.chooseFigure('pug');
    expect(facade.currentFigureId()).toBe('pug');
    expect(facade.allocationFor('pug')).toBe(3);
  });

  it('updates state reactively when RxDB tree state emits changes', async () => {
    const initialTree = createTreeState(DEFAULT_CHILD_ID);
    await treeRepo.save(initialTree);

    // Save tree state in RxDB with 40 points in 'comportamento'
    await treeRepo.save({
      ...initialTree,
      branches: {
        ...initialTree.branches,
        comportamento: 40,
      },
    });

    // Wait a brief moment for RxDB observable to push through PointsEffects
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(facade.rawPoints()).toBe(40);
    expect(facade.consolidatedPoints()).toBe(4);
  });

  it('adds removed points from an uncompleted figure to unassigned credits and ignores completed figures', () => {
    facade.addFigurePoints('cheetah', 3);
    expect(facade.allocationFor('cheetah')).toBe(3);
    const initialCredits = facade.unassignedCredits();

    facade.removeFigurePoints('cheetah', 2);
    expect(facade.allocationFor('cheetah')).toBe(1);
    expect(facade.unassignedCredits()).toBe(initialCredits + 2);

    // Complete/mount the figure
    facade.mountCurrentFigure(100);
    const mountedCredits = facade.unassignedCredits();

    // Trying to reclaim from a mounted figure must be a no-op
    facade.reclaimPoint(DEFAULT_FIGURE_ID);
    expect(facade.unassignedCredits()).toBe(mountedCredits);
    facade.removeFigurePoints(DEFAULT_FIGURE_ID, 10);
    expect(facade.unassignedCredits()).toBe(mountedCredits);
  });
  describe('multiple children', () => {
    let profiles: ChildProfilesStore;

    function switchTo(childId: string): void {
      profiles.selectChild(childId);
      TestBed.tick();
    }

    beforeEach(() => {
      profiles = TestBed.inject(ChildProfilesStore);
      TestBed.tick();
    });

    it('keeps the legacy storage key for the default child', () => {
      expect(figureProgressKey(DEFAULT_CHILD_ID)).toBe(STORAGE_KEY);
      expect(figureProgressKey('maria')).toBe(`${STORAGE_KEY}.maria`);
    });

    it('persists the default child under the legacy key', () => {
      facade.chooseFigure('pug');

      expect(localStorage.getItem(STORAGE_KEY)).toContain('"currentId":"pug"');
    });

    it('loads a fresh progression for a newly selected child', () => {
      facade.chooseFigure('pug');
      facade.addFigurePoints('pug', 3);
      const maria = profiles.registerChild({ name: 'Maria', avatarBustUrl: '', paperColor: '#7FB3D5' });

      switchTo(maria.id);

      expect(facade.childId()).toBe(maria.id);
      expect(facade.currentFigureId()).toBe(DEFAULT_FIGURE_ID);
      expect(facade.allocationFor('pug')).toBe(0);
    });

    it('restores each child progression when switching back and forth', () => {
      facade.chooseFigure('pug');
      const maria = profiles.registerChild({ name: 'Maria', avatarBustUrl: '', paperColor: '#7FB3D5' });

      switchTo(maria.id);
      facade.chooseFigure('brachiosaurus');
      expect(localStorage.getItem(figureProgressKey(maria.id))).toContain('"currentId":"brachiosaurus"');

      switchTo(DEFAULT_CHILD_ID);
      expect(facade.currentFigureId()).toBe('pug');

      switchTo(maria.id);
      expect(facade.currentFigureId()).toBe('brachiosaurus');
    });

    it('resets only the active child progression', () => {
      facade.chooseFigure('pug');
      const maria = profiles.registerChild({ name: 'Maria', avatarBustUrl: '', paperColor: '#7FB3D5' });
      switchTo(maria.id);
      facade.chooseFigure('brachiosaurus');

      facade.reset();

      expect(localStorage.getItem(figureProgressKey(maria.id))).toBeNull();
      expect(localStorage.getItem(STORAGE_KEY)).toContain('"currentId":"pug"');
      expect(facade.childId()).toBe(maria.id);
    });
  });
});
