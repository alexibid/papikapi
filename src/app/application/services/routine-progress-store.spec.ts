import { TestBed } from '@angular/core/testing';
import { RoutineProgressStore } from './routine-progress-store';

describe('RoutineProgressStore', () => {
  let store: RoutineProgressStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(RoutineProgressStore);
    store.reset();
  });

  it('initializes with WIREFRAME_ROUTINE and calculates total and doneCount', () => {
    expect(store.total()).toBe(4);
    expect(store.doneCount()).toBe(0);
  });

  it('toggles task status and updates doneCount reactively', () => {
    store.toggleTask('backpack');
    expect(store.doneCount()).toBe(1);

    store.toggleTask('backpack');
    expect(store.doneCount()).toBe(0);
  });

  it('completes a task', () => {
    store.completeTask('plate');
    expect(store.doneCount()).toBe(1);
    const plate = store.tasks().find((t) => t.id === 'plate');
    expect(plate?.status).toBe('done');
  });
});
