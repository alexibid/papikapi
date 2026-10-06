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

  it('ignores a corrupted stored value', () => {
    localStorage.setItem('papikapi.figure-progress', '{"currentId":3}');

    expect(TestBed.inject(FigureProgressStore).progress().currentId).toBe(DEFAULT_FIGURE_ID);
  });
});
