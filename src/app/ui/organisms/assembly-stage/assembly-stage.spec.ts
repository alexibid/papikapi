import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssemblyPlanService } from '@application/services/assembly-plan.service';
import { AssemblyStageComponent } from './assembly-stage';
import { FINAL_MODEL_LOADER } from './final-model-loader';
import { RENDERER_FACTORY } from './renderer-factory';

const stubRenderer = {
  setPixelRatio: vi.fn(),
  setSize: vi.fn(),
  render: vi.fn(),
  dispose: vi.fn(),
};

describe('AssemblyStageComponent', () => {
  const plans = { load: vi.fn().mockRejectedValue(new Error('offline')) };

  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [AssemblyStageComponent],
      providers: [
        { provide: AssemblyPlanService, useValue: plans },
        { provide: RENDERER_FACTORY, useValue: () => stubRenderer },
        { provide: FINAL_MODEL_LOADER, useValue: () => Promise.reject(new Error('offline')) },
      ],
    })
  );

  let fixture: ComponentFixture<AssemblyStageComponent>;

  function render(): HTMLElement {
    fixture = TestBed.createComponent(AssemblyStageComponent);
    fixture.componentRef.setInput('source', '/figures/t-rex/assembly.json');
    fixture.componentRef.setInput('ariaLabel', 'a paper figure being folded');
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('carries a text equivalent for the figure', () => {
    expect(render().querySelector('canvas')?.getAttribute('aria-label')).toBe(
      'a paper figure being folded'
    );
  });

  it('renders no visible text, even when the plan cannot be loaded', () => {
    expect(render().textContent?.trim()).toBe('');
  });

  describe('complete and animated modes', () => {
    function modeButtons(element: HTMLElement): HTMLButtonElement[] {
      return [...element.querySelectorAll<HTMLButtonElement>('.o-assembly-stage__mode button')];
    }

    it('offers one button for the complete figure and one for the animation', () => {
      expect(modeButtons(render())).toHaveLength(2);
    });

    it('starts in the animated mode', () => {
      const element = render();

      expect(element.querySelector('.o-assembly-stage--complete')).toBeNull();
      expect(element.querySelectorAll('.o-assembly-stage__mode--on')).toHaveLength(1);
    });

    it('switches to the complete figure and back to the animation', () => {
      const element = render();
      const complete = () => element.querySelector('.o-assembly-stage--complete');

      modeButtons(element)[0].click();
      fixture.detectChanges();
      expect(complete()).not.toBeNull();

      modeButtons(element)[1].click();
      fixture.detectChanges();
      expect(complete()).toBeNull();
    });
  });

  describe('focus before moving', () => {
    function canvasOf(element: HTMLElement): HTMLCanvasElement {
      return element.querySelector('canvas') as HTMLCanvasElement;
    }

    function wheel(canvas: HTMLCanvasElement): WheelEvent {
      const event = new WheelEvent('wheel', { deltaY: 100, cancelable: true, bubbles: true });
      canvas.dispatchEvent(event);
      return event;
    }

    it('leaves the wheel to the page until the canvas is clicked', () => {
      expect(wheel(canvasOf(render())).defaultPrevented).toBe(false);
    });

    it('takes the wheel once the canvas has been clicked', () => {
      const canvas = canvasOf(render());
      canvas.dispatchEvent(new Event('pointerdown', { bubbles: true }));

      expect(wheel(canvas).defaultPrevented).toBe(true);
    });

    it('gives the wheel back to the page when focus leaves the canvas', () => {
      const canvas = canvasOf(render());
      canvas.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      canvas.dispatchEvent(new Event('blur'));

      expect(wheel(canvas).defaultPrevented).toBe(false);
    });

    it('gives the wheel back to the page when the page scrolls', () => {
      const canvas = canvasOf(render());
      canvas.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      window.dispatchEvent(new Event('scroll'));

      expect(wheel(canvas).defaultPrevented).toBe(false);
    });

    it('shows a way out only while the canvas is active', () => {
      const element = render();
      const release = () => element.querySelector('.o-assembly-stage__release');

      expect(release()).toBeNull();

      canvasOf(element).dispatchEvent(new Event('pointerdown', { bubbles: true }));
      fixture.detectChanges();

      expect(release()).not.toBeNull();
    });

    it('gives the wheel back to the page on Escape', () => {
      const canvas = canvasOf(render());
      canvas.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(wheel(canvas).defaultPrevented).toBe(false);
    });
  });
});
