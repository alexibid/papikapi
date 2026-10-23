import { TestBed } from '@angular/core/testing';
import { ProgressPipsComponent } from './progress-pips';

describe('ProgressPipsComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [ProgressPipsComponent] }));

  function render(total: number, filled: number) {
    const fixture = TestBed.createComponent(ProgressPipsComponent);
    fixture.componentRef.setInput('total', total);
    fixture.componentRef.setInput('filled', filled);
    fixture.detectChanges();
    return fixture;
  }

  it('always draws 4 folds regardless of total piece count and unfolds by completion percentage', () => {
    expect(render(4, 0).nativeElement.querySelectorAll('.m-progress-pips__fold')).toHaveLength(4);
    expect(render(37, 18).nativeElement.querySelectorAll('.m-progress-pips__fold')).toHaveLength(4);
  });

  it('fills only the folds already reached', () => {
    expect(render(4, 3).nativeElement.querySelectorAll('.m-progress-pips__pip--filled')).toHaveLength(3);
  });

  it('renders as a single continuous bar and not separate cutouts', () => {
    const fixture = render(4, 2);
    const bar = fixture.nativeElement.querySelector('.m-progress-pips');
    expect(bar).not.toBeNull();
    expect(bar.querySelectorAll('.m-progress-pips__strip')).toHaveLength(1);
    expect(bar.querySelectorAll('.m-progress-pips__fold')).toHaveLength(4);
  });

  it('rests with non-base folds tucked to the left and no dinosaur paws or text when nothing is reached', () => {
    const fixture = render(4, 0);
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.m-progress-pips__pip--filled')).toHaveLength(0);
    // All folds are folded to the left in accordion harmónio
    expect(element.querySelectorAll('.m-progress-pips__fold--folded')).toHaveLength(4);
    expect(element.querySelectorAll('papikapi-sticker')).toHaveLength(0);
    expect(element.querySelector('.m-progress-pips')?.textContent?.trim()).toBe('');
  });

  it('unfolds folds as points accumulate', () => {
    const fixture = render(4, 2);
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.m-progress-pips__pip--filled')).toHaveLength(2);
  });

  it('transitions paper color across vermelho, laranja, amarelo, and turns verde only at 90% or above', () => {
    const redFixture = render(4, 0);
    expect(redFixture.componentInstance['stripColor']()).toContain('hsl(4,');

    const orangeFixture = render(4, 1);
    expect(orangeFixture.componentInstance['stripColor']()).toContain('hsl(20,');

    // 75% progress is warm golden yellow, NOT green
    const yellowFixture = render(4, 3);
    expect(yellowFixture.componentInstance['stripColor']()).toContain('hsl(53,');

    // 100% progress is vivid origami green
    const greenFixture = render(4, 4);
    expect(greenFixture.componentInstance['stripColor']()).toContain('hsl(142,');
  });

  it('opens full strip on peek button click, releases confetti from button at end of unfold, and reverts after 10 seconds', () => {
    vi.useFakeTimers();
    try {
      const fixture = render(4, 0);
      const button = fixture.nativeElement.querySelector('.m-progress-pips__peek-btn') as HTMLButtonElement;
      expect(button).not.toBeNull();

      expect(fixture.componentInstance.isPeeking()).toBe(false);
      button.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.isPeeking()).toBe(true);
      expect(fixture.componentInstance['effectiveFilled']()).toBe(4);
      expect(fixture.componentInstance['stripColor']()).toContain('hsl(142,');

      // Before unfold finishes, no button confetti yet
      expect(fixture.nativeElement.querySelectorAll('.m-progress-pips__btn-confetti-origin')).toHaveLength(0);

      // Sheet finishes slow unfolding at ~2400ms -> confetti spawns from button
      vi.advanceTimersByTime(2400);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('.m-progress-pips__btn-confetti-origin')).toHaveLength(1);
      expect(fixture.nativeElement.querySelectorAll('.m-progress-pips__btn-confetti-origin .m-progress-pips__confetti').length).toBeGreaterThan(0);

      // Reverts after 10 seconds (7600ms remaining)
      vi.advanceTimersByTime(7600);
      fixture.detectChanges();

      expect(fixture.componentInstance.isPeeking()).toBe(false);
      expect(fixture.componentInstance['effectiveFilled']()).toBe(0);
      expect(fixture.componentInstance['stripColor']()).toContain('hsl(4,');
    } finally {
      vi.useRealTimers();
    }
  });

  it('spawns cut paper confetti originating at unfolded fold when filled increases', () => {
    const fixture = render(4, 0);
    expect(fixture.nativeElement.querySelectorAll('.m-progress-pips__confetti-origin')).toHaveLength(0);

    fixture.componentRef.setInput('filled', 1);
    fixture.detectChanges();

    const origin = fixture.nativeElement.querySelector('.m-progress-pips__confetti-origin');
    expect(origin).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.m-progress-pips__confetti').length).toBeGreaterThan(0);
  });

  it('hides the strip from assistive technology when carrying no label', () => {
    const pips = render(3, 1).nativeElement.querySelector('.m-progress-pips');

    expect(pips?.getAttribute('aria-hidden')).toBe('true');
    expect(pips?.hasAttribute('role')).toBe(false);
  });
});
