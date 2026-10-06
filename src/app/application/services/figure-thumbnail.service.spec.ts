import { TestBed } from '@angular/core/testing';
import { AssemblyPlan } from '@domain/assembly/assembly-plan';
import { AssemblyPlanService } from './assembly-plan.service';
import { FigureThumbnailService } from './figure-thumbnail.service';

const PLAN: AssemblyPlan = {
  pieces: [
    {
      number: 1,
      tray: [0, 0],
      size: [1, 1],
      progressStart: 0,
      progressEnd: 1,
      faces: [
        {
          id: 1,
          parent: -1,
          depth: 0,
          polygon: [],
          solid: [[0, 0, 0], [10, 0, 0], [10, 10, 0]],
          colour: '#123456',
        },
      ],
    },
  ],
};

describe('FigureThumbnailService', () => {
  const load = vi.fn();

  beforeEach(() => {
    load.mockReset();
    TestBed.configureTestingModule({ providers: [{ provide: AssemblyPlanService, useValue: { load } }] });
  });

  it('projects the figure plan into facets', async () => {
    load.mockResolvedValue(PLAN);

    const facets = await TestBed.inject(FigureThumbnailService).load('t-rex');

    expect(facets).toHaveLength(1);
    expect(load).toHaveBeenCalledWith('/figures/t-rex/assembly.json');
  });

  it('loads each figure only once', async () => {
    load.mockResolvedValue(PLAN);
    const service = TestBed.inject(FigureThumbnailService);

    await service.load('t-rex');
    await service.load('t-rex');

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('tries again after a failure instead of remembering it', async () => {
    load.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(PLAN);
    const service = TestBed.inject(FigureThumbnailService);

    await expect(service.load('fox')).rejects.toThrow('offline');
    await expect(service.load('fox')).resolves.toHaveLength(1);
  });
});
