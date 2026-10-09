import { ComponentFixture, TestBed } from '@angular/core/testing';
import { I18N_CONFIG_TOKEN } from '@ibid/services';
import { PAPIKAPI_I18N_CONFIG } from '../../../i18n.config';
import { ModelCreationLoaderComponent } from './model-creation-loader';
import {
  CreationProgress,
  CreationProgressListener,
  CreationProgressService,
} from '@application/services/creation-progress.service';

describe('ModelCreationLoaderComponent', () => {
  let fixture: ComponentFixture<ModelCreationLoaderComponent>;
  let component: ModelCreationLoaderComponent;
  let progressListener: CreationProgressListener | undefined;
  const mockCreationService = {
    connect: vi.fn((_modelName: string, listener: CreationProgressListener) => {
      progressListener = listener;
      return () => {};
    }),
    triggerGeneration: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    progressListener = undefined;

    await TestBed.configureTestingModule({
      imports: [ModelCreationLoaderComponent],
      providers: [
        { provide: I18N_CONFIG_TOKEN, useValue: PAPIKAPI_I18N_CONFIG },
        { provide: CreationProgressService, useValue: mockCreationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ModelCreationLoaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('modelName', 'darth-cat');
    fixture.componentRef.setInput('prompt', 'black tuxedo cat');
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders initial stage text and simulated percent', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('A desenhar as primeiras ideias');
    expect(mockCreationService.triggerGeneration).toHaveBeenCalled();
    expect(mockCreationService.connect).toHaveBeenCalledWith('darth-cat', expect.any(Function));
  });

  it('updates stage and step number when progress arrives from service', () => {
    expect(progressListener).toBeDefined();

    progressListener?.({
      stepId: 's2-step-2',
      message: 'Synthesizing 3D',
      stepIndex: 2,
      stepCount: 4,
      expectedSeconds: 20,
      elapsedInStepMs: 2000,
      state: 'running',
    } as CreationProgress);

    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('A transformar em figura 3D');
  });

  it('marks done and emits completed event', () => {
    const completedSpy = vi.fn();
    component.completed.subscribe(completedSpy);

    progressListener?.({
      stepId: 's4-step-2',
      message: 'Finished',
      stepIndex: 3,
      stepCount: 4,
      expectedSeconds: 20,
      elapsedInStepMs: 2000,
      state: 'done',
    } as CreationProgress);

    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Prontinho! Vamos dobrar!');
    expect(component['isDone']()).toBe(true);

    vi.advanceTimersByTime(2500);
    expect(completedSpy).toHaveBeenCalledWith('darth-cat');
  });

  it('emits dismissed event when close button is clicked', () => {
    const dismissedSpy = vi.fn();
    component.dismissed.subscribe(dismissedSpy);

    const closeBtn = fixture.nativeElement.querySelector('.papikapi-creation-loader__close-btn') as HTMLButtonElement;
    closeBtn.click();

    expect(dismissedSpy).toHaveBeenCalled();
  });
});
