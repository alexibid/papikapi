import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18N_CONFIG_TOKEN } from '@ibid/services';
import { PAPIKAPI_I18N_CONFIG } from '../../i18n.config';
import { HomePage } from './home.page';
import { AssemblyPlanService } from '@application/services/assembly-plan.service';
import { FINAL_MODEL_LOADER } from '@ui/organisms/assembly-stage/final-model-loader';
import { RENDERER_FACTORY } from '@ui/organisms/assembly-stage/renderer-factory';
import { FigureProgressStore } from '@application/services/figure-progress-store';
import { DEFAULT_FIGURE_ID } from '@domain/data/shipped-figures';

const stubRenderer = {
  setPixelRatio: vi.fn(),
  setSize: vi.fn(),
  render: vi.fn(),
  dispose: vi.fn(),
};

describe('HomePage model selection and prompt flow', () => {
  let fixture: ComponentFixture<HomePage>;
  let component: HomePage;
  let store: FigureProgressStore;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        { provide: I18N_CONFIG_TOKEN, useValue: PAPIKAPI_I18N_CONFIG },
        { provide: AssemblyPlanService, useValue: { load: vi.fn().mockRejectedValue(new Error('offline')) } },
        { provide: RENDERER_FACTORY, useValue: () => stubRenderer },
        { provide: FINAL_MODEL_LOADER, useValue: () => Promise.reject(new Error('offline')) },
      ],
    }).compileComponents();

    store = TestBed.inject(FigureProgressStore);
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders buttons to choose model, view PDF, and view creation prompt', () => {
    const el = fixture.nativeElement as HTMLElement;
    const buttons = el.querySelectorAll('.papikapi-child__tool-btn');

    expect(buttons.length).toBe(3);
    expect(buttons[0].getAttribute('aria-label')).toBe('Escolher modelo');
    expect(buttons[1].getAttribute('aria-label')).toBe('Ver molde (PDF)');
    expect(buttons[1].getAttribute('href')).toContain('/figures/');
    expect(buttons[1].getAttribute('href')).toContain('/sheets.pdf');
    expect(buttons[2].getAttribute('aria-label')).toBe('Prompt do modelo');
  });

  it('hides stage tools when a model creation is active', () => {
    component['activeCreation'].set({
      name: 'cat',
      prompt: 'a cute cat',
      images: [],
      phase: 'alternatives',
    });
    fixture.detectChanges();

    const tools = fixture.nativeElement.querySelector('.papikapi-child__stage-tools');
    expect(tools).toBeNull();
  });

  it('opens PDF in new tab when openPdf is triggered', async () => {
    const windowSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    await component['openPdf']();
    expect(windowSpy).toHaveBeenCalledWith(expect.stringContaining('/sheets.pdf'), '_blank');
    windowSpy.mockRestore();
  });

  it('opens and closes the model picker modal', () => {
    expect(component['modelPickerOpen']()).toBe(false);

    component['openModelPicker']();
    fixture.detectChanges();
    expect(component['modelPickerOpen']()).toBe(true);

    const picker = fixture.nativeElement.querySelector('papikapi-model-picker-modal');
    expect(picker).not.toBeNull();

    component['closeModelPicker']();
    fixture.detectChanges();
    expect(component['modelPickerOpen']()).toBe(false);
  });

  it('switches current figure when a model is selected', () => {
    component['onModelSelected']('cheetah');

    expect(store.progress().currentId).toBe('cheetah');
    expect(component['modelPickerOpen']()).toBe(false);
  });

  it('protects prompt modal behind parental gate', () => {
    expect(component['gateOpen']()).toBe(false);
    expect(component['promptOpen']()).toBe(false);

    component['requestPromptAccess']();
    fixture.detectChanges();

    expect(component['gateOpen']()).toBe(true);
    expect(component['promptOpen']()).toBe(false);

    component['onGateUnlocked']();
    fixture.detectChanges();

    expect(component['gateOpen']()).toBe(false);
    expect(component['promptOpen']()).toBe(true);

    const promptModal = fixture.nativeElement.querySelector('papikapi-model-prompt-modal');
    expect(promptModal).not.toBeNull();

    component['closePrompt']();
    fixture.detectChanges();
    expect(component['promptOpen']()).toBe(false);
  });

  it('activates floating creation loader when onModelCreated is called and selects model on completion', () => {
    expect(component['activeCreation']()).toBeNull();

    component['onModelCreated']({
      name: 'cat-darth',
      prompt: 'a cute tuxedo cat',
      images: [],
    });
    fixture.detectChanges();

    expect(component['activeCreation']()).not.toBeNull();
    expect(component['activeCreation']()?.name).toBe('cat-darth');

    const loader = fixture.nativeElement.querySelector('papikapi-model-creation-loader');
    expect(loader).not.toBeNull();

    component['onCreationCompleted']('cat-darth');
    fixture.detectChanges();

    expect(component['activeCreation']()).toBeNull();
    expect(store.progress().currentId).toBe('cat-darth');

    // Test alternatives ready and picking flow
    component['onAlternativesReady']({
      name: 'cat-darth',
      sheetUrl: 'http://localhost:4502/api/creator/sheet?name=cat-darth',
    });
    fixture.detectChanges();
    expect(component['alternativesModalData']()).not.toBeNull();
    const altModal = fixture.nativeElement.querySelector('papikapi-model-alternatives-modal');
    expect(altModal).not.toBeNull();

    component['onAlternativePicked']({ name: 'cat-darth', pick: 4 });
    fixture.detectChanges();
    expect(component['alternativesModalData']()).toBeNull();
    expect(component['activeCreation']()?.phase).toBe('mesh');
    expect(component['activeCreation']()?.pick).toBe(4);

    component['closeAlternativesModal']();
    expect(component['alternativesModalData']()).toBeNull();

    // Test cancelCreation
    component['onModelCreated']({ name: 'temp', prompt: 'test', images: [] });
    expect(component['activeCreation']()).not.toBeNull();
    component['cancelCreation']();
    expect(component['activeCreation']()).toBeNull();
  });

  it('opens alternatives modal when model edit is requested from picker', () => {
    component['openModelPicker']();
    expect(component['modelPickerOpen']()).toBe(true);

    component['onModelEditRequested']('darth');
    fixture.detectChanges();

    expect(component['modelPickerOpen']()).toBe(false);
    expect(component['alternativesModalData']()).toEqual({
      name: 'darth',
      sheetUrl: expect.stringContaining('/api/creator/sheet?name=darth'),
    });

    const altModal = fixture.nativeElement.querySelector('papikapi-model-alternatives-modal');
    expect(altModal).not.toBeNull();
  });

  it('updates modelVersion and figure URLs when creation completes', () => {
    const initialVersion = component['modelVersion']();
    const initialSource = component['figureSource']();

    component['onCreationCompleted'](DEFAULT_FIGURE_ID);

    expect(component['modelVersion']()).toBeGreaterThanOrEqual(initialVersion);
    expect(component['figureSource']()).toContain(`?v=${component['modelVersion']()}`);
    expect(component['figureModel']()).toContain(`?v=${component['modelVersion']()}`);
    expect(initialSource).toContain(`?v=${initialVersion}`);
  });
});
