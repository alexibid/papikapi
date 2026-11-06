import { TestBed } from '@angular/core/testing';
import { CreationProgress, CreationProgressService } from './creation-progress.service';

describe('CreationProgressService', () => {
  let service: CreationProgressService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CreationProgressService);
  });

  it('triggers generation payload via POST fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));

    const ok = await service.triggerGeneration({
      id: 'k7f2p9qx',
      displayName: { pt: 'Gato Darth', en: 'Cat Darth' },
      prompt: 'a tuxedo cat',
      images: [],
    });

    expect(ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:4502/api/creator/generate',
      expect.objectContaining({ method: 'POST' })
    );

    fetchSpy.mockRestore();
  });

  it('captures error message when triggerGeneration fails', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Falha na geração FLUX' }), {
        status: 500,
        statusText: 'Internal Server Error',
      })
    );

    const ok = await service.triggerGeneration({
      id: 'k7f2p9qx',
      displayName: { pt: 'Gato Darth', en: 'Cat Darth' },
      prompt: 'a tuxedo cat',
      images: [],
    });

    expect(ok).toBe(false);
    expect(service.getLastError()).toBe('Falha na geração FLUX');

    fetchSpy.mockRestore();
  });

  it('connects to EventSource and dispatches progress updates', () => {
    let capturedListener: ((event: MessageEvent<string>) => void) | undefined;
    const closeSpy = vi.fn();

    class MockEventSource {
      set onmessage(fn: (event: MessageEvent<string>) => void) {
        capturedListener = fn;
      }
      close = closeSpy;
    }

    vi.stubGlobal('EventSource', MockEventSource);

    const received: CreationProgress[] = [];
    const unsubscribe = service.connect('k7f2p9qx', (p) => received.push(p));

    expect(capturedListener).toBeDefined();

    capturedListener?.({
      data: JSON.stringify({
        stepId: 's1-step-1',
        message: 'Generating',
        stepIndex: 0,
        stepCount: 4,
        expectedSeconds: 20,
        elapsedInStepMs: 1000,
        state: 'running',
      }),
    } as MessageEvent<string>);

    expect(received.length).toBe(1);
    expect(received[0].stepId).toBe('s1-step-1');

    unsubscribe();
    expect(closeSpy).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('triggers pick payload via POST fetch and returns sheetUrl', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));

    const ok = await service.triggerPick({ id: 'k7f2p9qx', pick: 3 });
    expect(ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:4502/api/creator/pick',
      expect.objectContaining({ method: 'POST' })
    );

    expect(service.sheetUrl('k7f2p9qx')).toContain('id=k7f2p9qx');
    fetchSpy.mockRestore();
  });

  it('fetches the catalogue with each figure display name', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([
          { id: 'k7f2p9qx', displayName: { pt: 'Gato Darth', en: 'Cat Darth' } },
          { id: 'm3x8q1za' },
        ]),
        { status: 200 }
      )
    );

    const catalogue = await service.fetchCatalogue();
    expect(catalogue).toEqual([
      { id: 'k7f2p9qx', displayName: { pt: 'Gato Darth', en: 'Cat Darth' } },
      { id: 'm3x8q1za', displayName: { pt: 'm3x8q1za', en: 'm3x8q1za' } },
    ]);
    fetchSpy.mockRestore();
  });
});
