import { TestBed } from '@angular/core/testing';
import { AssemblyPlanService } from './assembly-plan.service';
import { FigureAssetsService } from './figure-assets.service';

const HOSTING_REWRITE = (): Response =>
  new Response('<html></html>', { status: 200, headers: { 'content-type': 'text/html' } });

describe('AssemblyPlanService', () => {
  const assets = { assetUrl: vi.fn(async () => 'blob:from-assets') };

  beforeEach(() => {
    assets.assetUrl.mockClear();
    TestBed.configureTestingModule({
      providers: [{ provide: FigureAssetsService, useValue: assets }],
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('asks the assets host when the app host answers a missing figure with its index page', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) =>
      String(input).startsWith('blob:') ? new Response('not a plan', { status: 500 }) : HOSTING_REWRITE()
    );

    await expect(
      TestBed.inject(AssemblyPlanService).load('/figures/fox/assembly.json?v=1')
    ).rejects.toBeDefined();

    expect(assets.assetUrl).toHaveBeenCalledWith('fox', 'assembly.json');
  });

  it('prioritizes local studio and does not fetch bundled figure when studio is available', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (String(input).includes('localhost:4500')) {
        return new Response('{"broken":true}', { headers: { 'content-type': 'application/json' } });
      }
      return new Response('should not reach bundled', { status: 404 });
    });

    await expect(
      TestBed.inject(AssemblyPlanService).load('/figures/ankylosaurus/assembly.json')
    ).rejects.toBeDefined();

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:4500/models/ankylosaurus/assembly.json',
      { cache: 'no-store' }
    );
    expect(fetchSpy).not.toHaveBeenCalledWith('/figures/ankylosaurus/assembly.json', expect.anything());
    expect(assets.assetUrl).not.toHaveBeenCalled();
  });

  it('keeps the bundled figure when studio is unavailable and never asks the assets host for it', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (String(input).includes('localhost:4500')) {
        return new Response(null, { status: 404 });
      }
      return new Response('{"broken":true}', { headers: { 'content-type': 'application/json' } });
    });

    await expect(
      TestBed.inject(AssemblyPlanService).load('/figures/t-rex/assembly.json')
    ).rejects.toBeDefined();

    expect(fetchSpy).toHaveBeenCalledWith('/figures/t-rex/assembly.json', { cache: 'no-store' });
    expect(assets.assetUrl).not.toHaveBeenCalled();
  });
});
