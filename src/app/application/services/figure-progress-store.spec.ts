import { TestBed } from '@angular/core/testing';
import { DEFAULT_FIGURE_ID } from '@domain/data/shipped-figures';
import { FigureProgressStore } from './figure-progress-store';

describe('FigureProgressStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('starts on the default figure having seen only the plinth', () => {
    const { currentId, seenPieces, mountedIds } = TestBed.inject(FigureProgressStore).progress();

    expect([currentId, seenPieces, mountedIds]).toEqual([DEFAULT_FIGURE_ID, 1, []]);
  });

  it('remembers what the child has already seen across a reload', () => {
    TestBed.inject(FigureProgressStore).markSeen(4);
    TestBed.resetTestingModule();

    expect(TestBed.inject(FigureProgressStore).progress().seenPieces).toBe(4);
  });

  it('does not notify when the seen pieces have not changed', () => {
    const store = TestBed.inject(FigureProgressStore);
    const before = store.progress();

    store.markSeen(before.seenPieces);

    expect(store.progress()).toBe(before);
  });

  it('keeps a mounted figure on the shelf across a reload', () => {
    TestBed.inject(FigureProgressStore).mountCurrent(9);
    TestBed.resetTestingModule();

    const { mountedIds, currentId } = TestBed.inject(FigureProgressStore).progress();
    expect(mountedIds).toEqual([DEFAULT_FIGURE_ID]);
    expect(currentId).not.toBe(DEFAULT_FIGURE_ID);
  });

  it('switches to a waiting figure and remembers the choice across a reload', () => {
    TestBed.inject(FigureProgressStore).choose('ankylosaurus', 5);
    TestBed.resetTestingModule();

    const { currentId, seenPieces } = TestBed.inject(FigureProgressStore).progress();
    expect([currentId, seenPieces]).toEqual(['ankylosaurus', 5]);
  });

  it('allows direct selection of any catalogue figure even if mounted', () => {
    const store = TestBed.inject(FigureProgressStore);
    store.mountCurrent(9);
    store.select('t-rex');
    TestBed.resetTestingModule();

    const reloaded = TestBed.inject(FigureProgressStore).progress();
    expect(reloaded.currentId).toBe('t-rex');
    expect(reloaded.mountedIds).not.toContain('t-rex');
  });

  it('ignores invalid figure selection', () => {
    const store = TestBed.inject(FigureProgressStore);
    store.select('dragon-non-existent');

    expect(store.progress().currentId).toBe(DEFAULT_FIGURE_ID);
  });

  it('ignores a corrupted stored value', () => {
    localStorage.setItem('papikapi.figure-progress', '{"currentId":3}');

    expect(TestBed.inject(FigureProgressStore).progress().currentId).toBe(DEFAULT_FIGURE_ID);
  });

  it('allows registering and selecting custom figures', () => {
    const store = TestBed.inject(FigureProgressStore);
    store.registerCustomFigure('darth');

    expect(store.catalogue).toContain('darth');
    store.select('darth');
    expect(store.progress().currentId).toBe('darth');

    TestBed.resetTestingModule();
    const reloaded = TestBed.inject(FigureProgressStore);
    expect(reloaded.catalogue).toContain('darth');
    expect(reloaded.progress().currentId).toBe('darth');
  });

  it('allows selecting an uncatalogued figure when allowCustom is true', () => {
    const store = TestBed.inject(FigureProgressStore);
    store.select('custom-robo', { allowCustom: true });

    expect(store.progress().currentId).toBe('custom-robo');
    expect(store.catalogue).toContain('custom-robo');
  });

  it('resets seenPieces when selecting the same figure with forceReload', () => {
    const store = TestBed.inject(FigureProgressStore);
    store.markSeen(5);
    expect(store.progress().seenPieces).toBe(5);

    store.select(DEFAULT_FIGURE_ID);
    expect(store.progress().seenPieces).toBe(5);

    store.select(DEFAULT_FIGURE_ID, { forceReload: true });
    expect(store.progress().seenPieces).toBe(1);
  });
});
