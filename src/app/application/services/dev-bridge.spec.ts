import { TestBed } from '@angular/core/testing';
import { PapikapiDatabaseService } from '@infrastructure/rxdb/papikapi-database.service';
import { DEMO_ENTRY_COUNT } from '@application/testing/demo-seed';
import { DiaryStore } from './diary-store';
import { providePapikapiDevBridge } from './dev-bridge';

describe('the development bridge', () => {
  beforeEach(() => {
    sessionStorage.clear();
    delete window.papikapiDev;
    TestBed.configureTestingModule({ providers: [providePapikapiDevBridge()] });
  });

  afterEach(async () => {
    await TestBed.inject(PapikapiDatabaseService).close();
    delete window.papikapiDev;
  });

  it('exposes seeding and resetting on the window', () => {
    TestBed.inject(DiaryStore);

    expect(typeof window.papikapiDev?.seed).toBe('function');
    expect(typeof window.papikapiDev?.reset).toBe('function');
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
