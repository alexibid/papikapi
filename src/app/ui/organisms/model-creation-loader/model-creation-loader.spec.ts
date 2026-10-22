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
    triggerPick: vi.fn().mockResolvedValue(true),
    sheetUrl: vi.fn((name: string) => `http://localhost:4502/api/creator/sheet?name=${name}`),
    getLastError: vi.fn().mockReturnValue(null),
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

  it('marks alternatives ready and emits alternativesReady event in alternatives phase', () => {
    const readySpy = vi.fn();
    component.alternativesReady.subscribe(readySpy);

    progressListener?.({
      stepId: 's1-step-1',
      message: 'Finished',
      stepIndex: 1,
      stepCount: 1,
      expectedSeconds: 20,
      elapsedInStepMs: 2000,
      state: 'done',
    } as CreationProgress);

    fixture.detectChanges();
    expect(component['isDone']()).toBe(true);

    vi.advanceTimersByTime(1000);
    expect(readySpy).toHaveBeenCalledWith({
      name: 'darth-cat',
      sheetUrl: expect.stringContaining('darth-cat'),
    });
  });

  it('marks done and emits completed event in mesh phase', () => {
    fixture.componentRef.setInput('phase', 'mesh');
    fixture.detectChanges();

    const completedSpy = vi.fn();
    component.completed.subscribe(completedSpy);

    progressListener?.({
      stepId: 's2-step-2',
      message: 'Finished mesh',
      stepIndex: 3,
      stepCount: 3,
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

  it('detects waiting in queue and updates stage text and icon', () => {
    progressListener?.({
      stepId: 's1-step-1',
      message: '⟳ [RunPod Serverless] Generating sheet on Na fila de espera... (30s elapsed)',
      stepIndex: 0,
      stepCount: 1,
      expectedSeconds: 20,
      elapsedInStepMs: 30000,
      state: 'running',
    } as CreationProgress);

    fixture.detectChanges();

    expect(component['isQueued']()).toBe(true);
    expect(component['iconName']()).toBe('hourglass');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Na fila de espera do servidor');
  });

  it('displays custom failure message when progress arrives with state failed', () => {
    progressListener?.({
      stepId: 's1-step-1',
      message: 'Falha na geração FLUX: RunPod serverless job timed out',
      stepIndex: 0,
      stepCount: 1,
      expectedSeconds: 20,
      elapsedInStepMs: 30000,
      state: 'failed',
    } as CreationProgress);

    fixture.detectChanges();

    expect(component['isFailed']()).toBe(true);
    expect(component['iconName']()).toBe('close');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Falha na geração FLUX: RunPod serverless job timed out');
  });

  it('displays service error message when trigger fails', async () => {
    mockCreationService.getLastError.mockReturnValue('Erro no servidor FLUX');
    component['handleFailure']('Erro no servidor FLUX');
    fixture.detectChanges();

    expect(component['isFailed']()).toBe(true);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Erro no servidor FLUX');
  });

  it('opens and closes prompt modal when clicking prompt button and close', () => {
    const promptBtn = fixture.nativeElement.querySelector('.papikapi-creation-loader__prompt-btn') as HTMLButtonElement;
    expect(promptBtn).not.toBeNull();
    expect(promptBtn.textContent).toContain('Ver prompt');

    promptBtn.click();
    fixture.detectChanges();

    expect(component['isPromptModalOpen']()).toBe(true);
    let modal = fixture.nativeElement.querySelector('.papikapi-creation-loader-modal') as HTMLElement;
    expect(modal).not.toBeNull();
    expect(modal.textContent).toContain('Prompt de Geração');
    expect(modal.textContent).toContain('darth-cat');

    // Switch to user tab
    const tabs = fixture.nativeElement.querySelectorAll('.papikapi-creation-loader-modal__tab') as NodeListOf<HTMLButtonElement>;
    expect(tabs.length).toBe(4);
    tabs[1].click();
    fixture.detectChanges();
    expect(component['activePromptTab']()).toBe('user');
    expect(modal.textContent).toContain('black tuxedo cat');

    // Close modal
    const closeBtn = fixture.nativeElement.querySelector('.papikapi-creation-loader-modal__close') as HTMLButtonElement;
    closeBtn.click();
    fixture.detectChanges();
    expect(component['isPromptModalOpen']()).toBe(false);
    modal = fixture.nativeElement.querySelector('.papikapi-creation-loader-modal') as HTMLElement;
    expect(modal).toBeNull();
  });
});
