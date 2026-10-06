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

  async function render(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(FigureThumbnailComponent);
    fixture.componentRef.setInput('figureId', 't-rex');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('draws the facets of the figure once they are loaded', async () => {
    load.mockResolvedValue([
      { points: '0,0 10,0 10,10', fill: '#112233' },
      { points: '0,0 10,10 0,10', fill: '#445566' },
    ]);

    expect((await render()).querySelectorAll('polygon')).toHaveLength(2);
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
