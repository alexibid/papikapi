import { TestBed } from '@angular/core/testing';
import { STAGE_ORNAMENTS } from './ornaments';
import { SceneryComponent } from './scenery';

describe('SceneryComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SceneryComponent] }));

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(SceneryComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('draws one pictogram per ornament', () => {
    expect(render().querySelectorAll('.o-scenery__ornament')).toHaveLength(STAGE_ORNAMENTS.length);
  });

  it('is hidden from assistive technology', () => {
    expect(render().querySelector('.o-scenery')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('sizes and places each ornament from its own description', () => {
    const first = render().querySelector<HTMLElement>('.o-scenery__ornament');

    expect(first?.style.width).toBe(STAGE_ORNAMENTS[0].style['width']);
    expect(first?.style.left).toBe(STAGE_ORNAMENTS[0].style['left']);
  });
});
