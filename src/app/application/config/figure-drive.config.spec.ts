import { TestBed } from '@angular/core/testing';
import { FIGURE_DRIVE_CONFIG_TOKEN, FigureDriveConfigStore } from './figure-drive.config';

describe('FigureDriveConfigStore', () => {
  afterEach(() => vi.restoreAllMocks());

  it('starts with Drive off: no api key until the runtime config arrives', () => {
    const store = TestBed.inject(FigureDriveConfigStore);

    expect(store.config().apiKey).toBe('');
    expect(store.config().indexFileId).not.toBe('');
  });

  it('reads the api key and the index id from /app-env.json', async () => {
    const body = JSON.stringify({ driveApiKey: 'key-1', driveIndexFileId: 'index-1' });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body));
    const store = TestBed.inject(FigureDriveConfigStore);

    await store.load();

    expect(fetchSpy).toHaveBeenCalledWith('/app-env.json', { cache: 'no-store' });
    expect(store.config()).toEqual({ apiKey: 'key-1', indexFileId: 'index-1' });
  });

  it('exposes the loaded values through the config token', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"driveApiKey":"key-2"}'));
    await TestBed.inject(FigureDriveConfigStore).load();

    expect(TestBed.inject(FIGURE_DRIVE_CONFIG_TOKEN).apiKey).toBe('key-2');
  });

  it.each([
    ['a missing file', new Response('not found', { status: 404 })],
    ['a hosting rewrite that answers html', new Response('<html></html>', { status: 200 })],
  ])('keeps Drive off when the config is %s', async (_name, response) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);
    const store = TestBed.inject(FigureDriveConfigStore);

    await store.load();

    expect(store.config().apiKey).toBe('');
  });

  it('keeps Drive off when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'));
    const store = TestBed.inject(FigureDriveConfigStore);

    await expect(store.load()).resolves.toBeUndefined();
    expect(store.config().apiKey).toBe('');
  });
});
