import { TestBed } from '@angular/core/testing';
import { ProgressPipsComponent } from './progress-pips';

describe('ProgressPipsComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [ProgressPipsComponent] }));

  function render(total: number, filled: number): HTMLElement {
    const fixture = TestBed.createComponent(ProgressPipsComponent);
    fixture.componentRef.setInput('total', total);
    fixture.componentRef.setInput('filled', filled);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('draws one pip per step', () => {
    expect(render(4, 0).querySelectorAll('.m-progress-pips__pip')).toHaveLength(4);
  });

  it('fills only the pips already reached', () => {
    expect(render(4, 3).querySelectorAll('.m-progress-pips__pip--filled')).toHaveLength(3);
  });

  it('rests with every pip empty and no text when nothing is reached', () => {
    const element = render(3, 0);

    expect(element.querySelectorAll('.m-progress-pips__pip--filled')).toHaveLength(0);
    expect(element.textContent?.trim()).toBe('');
  });

  it('hides the pips from assistive technology when they carry no label', () => {
    const pips = render(3, 1).querySelector('.m-progress-pips');

    expect(pips?.getAttribute('aria-hidden')).toBe('true');
    expect(pips?.hasAttribute('role')).toBe(false);
  });
});
