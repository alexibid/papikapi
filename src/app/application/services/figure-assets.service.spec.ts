import { TestBed } from '@angular/core/testing';
import { FIGURE_ASSETS_BASE_URL } from '@application/config/figure-assets.config';
import { FigureAssetsService } from './figure-assets.service';

const BASE = 'https://assets.test/figures';

function indexWith(revision: string): string {
  return JSON.stringify([
    { id: 'fox', files: { 'model.glb': { rev: revision } }, pdf: { id: 'pdf-1' } },
    { id: 'owl', files: {} },
  ]);
}

function hostStub(revision: () => string): (input: RequestInfo | URL) => Promise<Response> {
  return async (input) => {
    const url = new URL(String(input));
    const body = url.pathname.endsWith('/index.json') ? indexWith(revision()) : 'glb-bytes';
    return new Response(body, { status: 200, headers: { 'content-type': 'application/octet-stream' } });
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

function service(): FigureAssetsService {
  TestBed.configureTestingModule({ providers: [{ provide: FIGURE_ASSETS_BASE_URL, useValue: BASE }] });
  return TestBed.inject(FigureAssetsService);
}

describe('FigureAssetsService', () => {
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

  it('lists the published figures from the index of the assets host', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(hostStub(() => revision));

    await expect(service().catalogueIds()).resolves.toEqual(['fox', 'owl']);
  });

  it('downloads an asset from its own url with the revision as cache buster', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(hostStub(() => revision));

    await expect(service().assetUrl('fox', 'model.glb')).resolves.toBe('blob:figure');

    const urls = fetchSpy.mock.calls.map(([input]) => String(input));
    expect(urls).toContain(`${BASE}/fox/model.glb?v=r1`);
  });

  it('never sends a credential: no key, token or authorization header', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(hostStub(() => revision));

    await service().assetUrl('fox', 'model.glb');

    const urls = fetchSpy.mock.calls.map(([input]) => String(input));
    expect(urls.some((url) => /key=|token=|access_token/i.test(url))).toBe(false);
    expect(fetchSpy.mock.calls.every(([, init]) => !init?.headers)).toBe(true);
  });

  it('downloads again only when the published revision changed', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(hostStub(() => revision));
    const downloads = () =>
      fetchSpy.mock.calls.filter(([input]) => String(input).includes('/fox/model.glb')).length;

    await service().assetUrl('fox', 'model.glb');
    TestBed.resetTestingModule();
    await service().assetUrl('fox', 'model.glb');
    expect(downloads()).toBe(1);

    revision = 'r2';
    TestBed.resetTestingModule();
    await service().assetUrl('fox', 'model.glb');
    expect(downloads()).toBe(2);
  });

  it('opens again without network using the cached index and asset', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(hostStub(() => revision));
    await service().assetUrl('fox', 'model.glb');
    TestBed.resetTestingModule();
    const offline = service();

    fetchSpy.mockRejectedValue(new TypeError('offline'));

    await expect(offline.catalogueIds()).resolves.toEqual(['fox', 'owl']);
    await expect(offline.assetUrl('fox', 'model.glb')).resolves.toBe('blob:figure');
  });

  it('treats a host answering html as unavailable', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<html></html>', { status: 200, headers: { 'content-type': 'text/html' } })
    );

    await expect(service().catalogueIds()).rejects.toBeDefined();
  });

  it('rejects a file or a figure that was never published', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(hostStub(() => revision));
    const assets = service();

    await expect(assets.assetUrl('owl', 'model.glb')).rejects.toThrow('not published');
    await expect(assets.assetUrl('ghost', 'model.glb')).rejects.toThrow('not published');
  });

  it('builds the Drive viewer link for the pdf without any key', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(hostStub(() => revision));

    await expect(service().pdfUrl('fox')).resolves.toBe('https://drive.google.com/file/d/pdf-1/view');
    await expect(service().pdfUrl('owl')).rejects.toThrow('pdf not published');
  });
});
