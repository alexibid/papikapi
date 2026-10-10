import { TestBed } from '@angular/core/testing';
import {
  FIGURE_DRIVE_CONFIG_TOKEN,
  FigureDriveConfig,
} from '@application/config/figure-drive.config';
import { FigureDriveService } from './figure-drive.service';

const CONFIGURED: FigureDriveConfig = { indexFileId: 'index-id', apiKey: 'key' };

function indexWith(revision: string): string {
  return JSON.stringify([
    { id: 'fox', files: { 'model.glb': { id: 'glb-id', rev: revision } } },
    { id: 'owl', files: {} },
  ]);
}

function driveStub(revision: () => string): (input: RequestInfo | URL) => Promise<Response> {
  return async (input) => {
    const id = new URL(String(input)).pathname.split('/').pop();
    return new Response(id === 'index-id' ? indexWith(revision()) : 'glb-bytes', { status: 200 });
  };
}

function fakeCacheStorage(): CacheStorage {
  const stored = new Map<string, Response>();
  const cache = {
    match: async (key: RequestInfo | URL) => stored.get(String(key))?.clone(),
    put: async (key: RequestInfo | URL, response: Response) => {
      stored.set(String(key), response);
    },
  };
  return { open: async () => cache } as unknown as CacheStorage;
}

function configure(config: FigureDriveConfig): FigureDriveService {
  TestBed.configureTestingModule({
    providers: [{ provide: FIGURE_DRIVE_CONFIG_TOKEN, useValue: config }],
  });
  return TestBed.inject(FigureDriveService);
}

describe('FigureDriveService', () => {
  let revision = 'r1';

  beforeEach(() => {
    revision = 'r1';
    URL.createObjectURL = vi.fn(() => 'blob:figure');
    URL.revokeObjectURL = vi.fn();
    vi.stubGlobal('caches', fakeCacheStorage());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('stays disabled without an index file id or without an api key', async () => {
    expect(configure({ indexFileId: '', apiKey: 'key' }).isConfigured()).toBe(false);
    TestBed.resetTestingModule();
    const service = configure({ indexFileId: 'index-id', apiKey: '' });

    expect(service.isConfigured()).toBe(false);
    await expect(service.assetUrl('fox', 'model.glb')).rejects.toThrow('not configured');
  });

  it('lists the published figures from the index', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(driveStub(() => revision));
    const service = configure(CONFIGURED);

    await expect(service.catalogueIds()).resolves.toEqual(['fox', 'owl']);
  });

  it('downloads an asset by its Drive id through the Drive API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(driveStub(() => revision));
    const service = configure(CONFIGURED);

    await expect(service.assetUrl('fox', 'model.glb')).resolves.toBe('blob:figure');

    const urls = fetchSpy.mock.calls.map(([input]) => String(input));
    expect(urls).toContain('https://www.googleapis.com/drive/v3/files/glb-id?alt=media&key=key');
  });

  it('downloads again only when the published revision changed', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(driveStub(() => revision));
    const downloads = () =>
      fetchSpy.mock.calls.filter(([input]) => String(input).includes('/files/glb-id')).length;

    const first = configure(CONFIGURED);
    await first.assetUrl('fox', 'model.glb');
    await first.assetUrl('fox', 'model.glb');
    expect(downloads()).toBe(1);

    revision = 'r2';
    TestBed.resetTestingModule();
    const reopened = configure(CONFIGURED);
    await reopened.assetUrl('fox', 'model.glb');
    expect(downloads()).toBe(2);
  });

  it('opens again without network using the cached index and asset', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(driveStub(() => revision));
    await configure(CONFIGURED).assetUrl('fox', 'model.glb');
    TestBed.resetTestingModule();
    const offline = configure(CONFIGURED);

    fetchSpy.mockRejectedValue(new TypeError('offline'));

    await expect(offline.catalogueIds()).resolves.toEqual(['fox', 'owl']);
    await expect(offline.assetUrl('fox', 'model.glb')).resolves.toBe('blob:figure');
  });

  it('fails clearly when Drive is unreachable and nothing was cached', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'));
    const service = configure(CONFIGURED);

    await expect(service.catalogueIds()).rejects.toThrow('offline');
  });

  it('rejects a file that was never published', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(driveStub(() => revision));
    const service = configure(CONFIGURED);

    await expect(service.assetUrl('owl', 'model.glb')).rejects.toThrow('not published');
  });

  it('builds a Drive viewer link for files opened outside the app', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(driveStub(() => revision));
    const service = configure(CONFIGURED);

    await expect(service.viewUrl('fox', 'model.glb')).resolves.toBe(
      'https://drive.google.com/file/d/glb-id/view'
    );
  });
});
