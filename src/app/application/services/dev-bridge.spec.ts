import { TestBed } from '@angular/core/testing';
import { PapikapiDatabaseService } from '@infrastructure/rxdb/papikapi-database.service';
import { DEMO_ENTRY_COUNT } from '@application/testing/demo-seed';
import { DiaryStore } from './diary-store';
import { FigureProgressStore } from './figure-progress-store';
import { providePapikapiDevBridge } from './dev-bridge';

describe('the development bridge', () => {
  beforeEach(() => {
    sessionStorage.clear();
    delete window.papikapiDev;
    delete window.papikapi;
    TestBed.configureTestingModule({ providers: [providePapikapiDevBridge()] });
  });

  afterEach(async () => {
    await TestBed.inject(PapikapiDatabaseService).close();
    TestBed.resetTestingModule();
    delete window.papikapiDev;
    delete window.papikapi;
  });

  it('exposes seeding, resetting, addPoints and removePoints on the window', () => {
    TestBed.inject(DiaryStore);

    expect(typeof window.papikapiDev?.seed).toBe('function');
    expect(typeof window.papikapiDev?.reset).toBe('function');
    expect(typeof window.papikapiDev?.addPoints).toBe('function');
    expect(typeof window.papikapiDev?.removePoints).toBe('function');
    expect(window.papikapi).toBe(window.papikapiDev);
  });

  it('allows manipulating figure points via papikapi.addPoints and papikapi.removePoints', () => {
    TestBed.inject(DiaryStore);
    const progressStore = TestBed.inject(FigureProgressStore);
    progressStore.syncTotalPoints(100);

    const curId = progressStore.progress().currentId;
    const initialPts = progressStore.allocation(curId);

    window.papikapi?.removePoints();
    expect(progressStore.allocation(curId)).toBe(initialPts - 1);
    expect(progressStore.unassignedCredits()).toBe(1);

    window.papikapi?.addPoints();
    expect(progressStore.allocation(curId)).toBe(initialPts);

    window.papikapi?.addPoints(2, 'fox');
    expect(progressStore.allocation('fox')).toBe(2);

    window.papikapi?.removePoints(2, 'fox');
    expect(progressStore.allocation('fox')).toBe(0);
  });

  it('fills an empty database so the first run is never a blank app', async () => {
    const store = TestBed.inject(DiaryStore);

    await store.seedIfEmpty();

    expect(store.entries()).toHaveLength(DEMO_ENTRY_COUNT);
    expect(store.tree().badges.length).toBeGreaterThan(6);
  });

  it('leaves an existing history alone', async () => {
    const store = TestBed.inject(DiaryStore);
    await store.seedIfEmpty();

    await store.seedIfEmpty();

    expect(store.entries()).toHaveLength(DEMO_ENTRY_COUNT);
  });

  it('seeds on demand through the bridge', async () => {
    const store = TestBed.inject(DiaryStore);
    await window.papikapiDev?.reset();

    await window.papikapiDev?.seed();

    expect(store.entries()).toHaveLength(DEMO_ENTRY_COUNT);
  });

  it('does not refill a database the user emptied on purpose', async () => {
    const store = TestBed.inject(DiaryStore);
    await store.seedIfEmpty();

    await window.papikapiDev?.reset();
    await TestBed.inject(PapikapiDatabaseService).close();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [providePapikapiDevBridge()] });
    const revived = TestBed.inject(DiaryStore);
    await revived.load();

    expect(revived.entries()).toHaveLength(0);
  });

  it('clears everything through the bridge', async () => {
    const store = TestBed.inject(DiaryStore);
    await store.seedIfEmpty();

    await window.papikapiDev?.reset();

    expect(store.entries()).toHaveLength(0);
    expect(store.tree().badges).toHaveLength(0);
  });
});
