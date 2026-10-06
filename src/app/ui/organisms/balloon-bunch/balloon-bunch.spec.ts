import { TestBed } from '@angular/core/testing';
import { BalloonBunchComponent } from './balloon-bunch';

describe('BalloonBunchComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [BalloonBunchComponent] }));

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(BalloonBunchComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('ties one twisted string to each balloon', () => {
    const element = render();

    expect(element.querySelectorAll('.o-balloon-bunch__string')).toHaveLength(3);
    expect(element.querySelectorAll('.o-balloon-bunch__twist')).toHaveLength(3);
  });

  it('shows the cut-out balloons above the strings', () => {
    expect(render().querySelector('image')?.getAttribute('href')).toBe('scene/balloons.webp');
  });

  it('is hidden from assistive technology', () => {
    expect(render().querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});
