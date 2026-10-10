import { TestBed } from '@angular/core/testing';
import {
  FIGURE_DRIVE_CONFIG_TOKEN,
  FigureDriveConfig,
} from '@application/config/figure-drive.config';
import { FigureDriveService } from './figure-drive.service';

const CONFIGURED: FigureDriveConfig = { rootFolderId: 'root', apiKey: 'key' };
const FILE_IDS: Readonly<Record<string, string>> = {
  figures: 'figures-id',
  'fox': 'fox-id',
  'model.glb': 'glb-id',
  'index.json': 'index-id',
};

function queriedName(url: string): string {
  const query = new URL(url).searchParams.get('q') ?? '';
  return /name='([^']+)'/.exec(query)?.[1] ?? '';
}

function driveStub(modified: () => string): (input: RequestInfo | URL) => Promise<Response> {
  return async (input) => {
    const url = String(input);
    if (url.includes('alt=media')) {
      const body = url.includes('index-id') ? '[{"id":"fox"},{"id":"owl"}]' : 'glb-bytes';
      return new Response(body, { status: 200 });
    }
    const id = FILE_IDS[queriedName(url)];
    const files = id ? [{ id, modifiedTime: modified() }] : [];
    return new Response(JSON.stringify({ files }), { status: 200 });
  };
}

function configure(config: FigureDriveConfig): FigureDriveService {
  TestBed.configureTestingModule({
    providers: [{ provide: FIGURE_DRIVE_CONFIG_TOKEN, useValue: config }],
  });
  return TestBed.inject(FigureDriveService);
}

describe('FigureDriveService', () => {
  let modified = 'v1';

  beforeEach(() => {
    modified = 'v1';
    URL.createObjectURL = vi.fn(() => 'blob:figure');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => vi.restoreAllMocks());

  it('stays disabled without a folder id and an api key', async () => {
    const service = configure({ rootFolderId: '', apiKey: '' });

    expect(service.isConfigured()).toBe(false);
    await expect(service.assetUrl('fox', 'model.glb')).rejects.toThrow('not configured');
  });

  it('finds the figure folder and downloads the asset with the api key', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(driveStub(() => modified));
    const service = configure(CONFIGURED);

    const url = await service.assetUrl('fox', 'model.glb');

    expect(url).toBe('blob:figure');
    const downloads = fetchSpy.mock.calls.filter(([input]) => String(input).includes('alt=media'));
    expect(String(downloads[0][0])).toContain('/files/glb-id?alt=media&key=key');
  });

  it('downloads again only when the file changed on Drive', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(driveStub(() => modified));
    const service = configure(CONFIGURED);
    const downloads = () =>
      fetchSpy.mock.calls.filter(([input]) => String(input).includes('alt=media')).length;

    await service.assetUrl('fox', 'model.glb');
    await service.assetUrl('fox', 'model.glb');
    expect(downloads()).toBe(1);

    modified = 'v2';
    await service.assetUrl('fox', 'model.glb');
    expect(downloads()).toBe(2);
  });

  it('serves the cached asset when Drive cannot be reached', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(driveStub(() => modified));
    const service = configure(CONFIGURED);
    await service.assetUrl('fox', 'model.glb');

    fetchSpy.mockRejectedValue(new TypeError('offline'));

    await expect(service.assetUrl('fox', 'model.glb')).resolves.toBe('blob:figure');
  });

  it('reads the catalogue ids from the published index', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(driveStub(() => modified));
    const service = configure(CONFIGURED);

    await expect(service.catalogueIds()).resolves.toEqual(['fox', 'owl']);
  });

  it('builds a Drive viewer link for files opened outside the app', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(driveStub(() => modified));
    const service = configure(CONFIGURED);

    await expect(service.viewUrl('fox', 'model.glb')).resolves.toBe(
      'https://drive.google.com/file/d/glb-id/view'
    );
  });
});
