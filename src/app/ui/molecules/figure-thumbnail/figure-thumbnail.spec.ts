import { TestBed } from '@angular/core/testing';
import { FigureThumbnailService } from '@application/services/figure-thumbnail.service';
import { FigureThumbnailComponent } from './figure-thumbnail';

describe('FigureThumbnailComponent', () => {
  const load = vi.fn();

  beforeEach(() => {
    load.mockReset();
    TestBed.configureTestingModule({
      imports: [FigureThumbnailComponent],
      providers: [{ provide: FigureThumbnailService, useValue: { load } }],
    });
  });

  async function render(progress = 1): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(FigureThumbnailComponent);
    fixture.componentRef.setInput('figureId', 't-rex');
    fixture.componentRef.setInput('progress', progress);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('draws the wireframe and painted facets of the figure once loaded', async () => {
    load.mockResolvedValue([
      { points: '0,0 10,0 10,10', fill: '#112233' },
      { points: '0,0 10,10 0,10', fill: '#445566' },
    ]);

    const element = await render(1);
    expect(element.querySelectorAll('.m-figure-thumbnail__wireframe polygon')).toHaveLength(2);
    expect(element.querySelectorAll('.m-figure-thumbnail__painted polygon')).toHaveLength(2);
  });

  it('shows only wireframe when progress is 0', async () => {
    load.mockResolvedValue([{ points: '0,0 10,0 10,10', fill: '#112233' }]);

    const element = await render(0);
    expect(element.querySelectorAll('.m-figure-thumbnail__wireframe polygon')).toHaveLength(1);
    expect(element.querySelector('.m-figure-thumbnail__painted')).toBeNull();
  });

  it('adjusts clipPath coordinates to reveal figure from bottom to top', async () => {
    load.mockResolvedValue([{ points: '0,0 10,0 10,10', fill: '#112233' }]);

    const element = await render(0.6);
    const rect = element.querySelector('.m-figure-thumbnail__clip-rect');
    expect(rect?.getAttribute('y')).toBe('40');
    expect(rect?.getAttribute('height')).toBe('60');
  });

  it('falls back to the trophy icon when the figure cannot be loaded', async () => {
    load.mockRejectedValue(new Error('offline'));

    const element = await render();

    expect(element.querySelector('.m-figure-thumbnail')).toBeNull();
    expect(element.querySelector('papikapi-pictogram')).not.toBeNull();
  });

  it('is hidden from assistive technology and carries no text', async () => {
    load.mockResolvedValue([{ points: '0,0 10,0 10,10', fill: '#112233' }]);

    const element = await render();

    expect(element.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(element.textContent?.trim()).toBe('');
  });
});
