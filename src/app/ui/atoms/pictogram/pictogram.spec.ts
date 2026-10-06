import { TestBed } from '@angular/core/testing';
import { PAPER_ICONS } from './paper-icons';
import { PictogramComponent } from './pictogram';

describe('PictogramComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [PictogramComponent] }));

  function render(name: 'bed' | 'mascot'): HTMLElement {
    const fixture = TestBed.createComponent(PictogramComponent);
    fixture.componentRef.setInput('name', name);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('draws one polygon per facet of the registered icon', () => {
    expect(render('bed').querySelectorAll('polygon')).toHaveLength(PAPER_ICONS.bed.facets.length);
  });

  it('fits the view box to the icon grid', () => {
    expect(render('mascot').querySelector('svg')?.getAttribute('viewBox')).toBe(
      `0 0 ${PAPER_ICONS.mascot.size} ${PAPER_ICONS.mascot.size}`
    );
  });

  it('is hidden from assistive technology and carries no text', () => {
    const element = render('bed');

    expect(element.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(element.textContent?.trim()).toBe('');
  });
});
