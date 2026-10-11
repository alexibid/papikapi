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

  it('keeps the bundled figure and never asks the assets host for it', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"broken":true}', { headers: { 'content-type': 'application/json' } })
    );

    await expect(
      TestBed.inject(AssemblyPlanService).load('/figures/t-rex/assembly.json')
    ).rejects.toBeDefined();

    expect(assets.assetUrl).not.toHaveBeenCalled();
  });
});
