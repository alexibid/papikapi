import { ComponentFixture, TestBed } from '@angular/core/testing';
import { I18N_CONFIG_TOKEN, SpeechRecognitionService, TranslationService } from '@ibid/services';
import { PAPIKAPI_I18N_CONFIG } from '../../i18n.config';
import { ModelPromptModalComponent } from '../../ui/organisms/model-prompt-modal/model-prompt-modal';

describe('User Journey: Voice-to-Prompt Figure Creation Flow (Generic OCP Dictation PT -> EN)', () => {
  let fixture: ComponentFixture<ModelPromptModalComponent>;
  let component: ModelPromptModalComponent;
  let speechService: SpeechRecognitionService;
  let translationService: TranslationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelPromptModalComponent],
      providers: [
        { provide: I18N_CONFIG_TOKEN, useValue: PAPIKAPI_I18N_CONFIG },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ModelPromptModalComponent);
    component = fixture.componentInstance;
    speechService = TestBed.inject(SpeechRecognitionService);
    translationService = TestBed.inject(TranslationService);
    fixture.detectChanges();
  });

  it('executes complete 3-button user flow: Gravar (60s session) -> Parar -> Aceitar -> edit in PT -> submit translates to EN', async () => {
    // -------------------------------------------------------------
    // Step 1: Initial State - User opens model creation modal
    // -------------------------------------------------------------
    expect(component.promptText()).toBe('');
    expect(component.modelName()).toBe('');
    expect(component.isCreating()).toBe(false);

    const dictationEl = fixture.nativeElement.querySelector('ibid-voice-dictation');
    expect(dictationEl).toBeTruthy();

    const buttons = dictationEl.querySelectorAll('ibid-button button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
    // Button 1: Gravar (active)
    expect(buttons[0].textContent).toContain('Gravar');
    expect(buttons[0].getAttribute('aria-disabled')).toBeNull();
    // Button 2: Parar (disabled until recording)
    expect(buttons[1].textContent).toContain('Parar');
    expect(buttons[1].getAttribute('aria-disabled')).toBe('true');
    // Button 3: Aceitar (disabled until text available)
    expect(buttons[2].textContent).toContain('Aceitar');
    expect(buttons[2].getAttribute('aria-disabled')).toBe('true');

    // -------------------------------------------------------------
    // Step 2: User clicks Gravar (starts 60-second voice session)
    // -------------------------------------------------------------
    const startSpy = vi.spyOn(speechService, 'startRecording').mockImplementation(async () => {
      speechService.state.set('recording');
    });

    buttons[0].click();
    fixture.detectChanges();

    expect(startSpy).toHaveBeenCalledWith({
      lang: 'pt-PT',
      timeoutSeconds: 60,
    });
    expect(speechService.isListening()).toBe(true);

    // -------------------------------------------------------------
    // Step 3: Speech recognition streams Portuguese words
    // -------------------------------------------------------------
    const spokenText = 'gato preto e branco com asas douradas';
    speechService.transcript.set(spokenText);
    fixture.detectChanges();

    // The live preview inside the generic dictation component displays what is spoken
    const preview = dictationEl.querySelector('.m-voice-dictation__preview-text');
    expect(preview?.textContent).toContain(spokenText);

    // -------------------------------------------------------------
    // Step 4: User clicks Parar, then Aceitar
    // -------------------------------------------------------------
    const pauseSpy = vi.spyOn(speechService, 'pauseRecording').mockImplementation(() => {
      speechService.state.set('paused');
    });
    vi.spyOn(speechService, 'accept').mockReturnValue(spokenText);

    // Click Parar
    const stopBtn = dictationEl.querySelectorAll('ibid-button button')[1];
    stopBtn.click();
    fixture.detectChanges();
    expect(pauseSpy).toHaveBeenCalled();

    // Click Aceitar
    const acceptBtn = dictationEl.querySelectorAll('ibid-button button')[2];
    acceptBtn.click();
    fixture.detectChanges();

    // The prompt box now contains the accepted Portuguese text
    expect(component.promptText()).toBe(spokenText);
    expect(component.derivedFolderSlug()).toBe('cat-black-white');

    // -------------------------------------------------------------
    // Step 5: User reviews and manually edits in Portuguese
    // -------------------------------------------------------------
    const editedPortuguese = 'gato preto e branco com asas douradas e olhos verdes';
    component.promptText.set(editedPortuguese);
    fixture.detectChanges();

    expect(component.promptText()).toBe(editedPortuguese);

    // -------------------------------------------------------------
    // Step 6: User clicks CRIAR (Submit) -> Translation happens upon submit
    // -------------------------------------------------------------
    vi.spyOn(translationService, 'translate').mockResolvedValue(
      'bicolor black and white cat with gold wings and green eyes'
    );

    let emittedEvent: { name: string; prompt: string; images: readonly string[] } | undefined;
    component.modelCreated.subscribe((payload) => {
      emittedEvent = payload;
    });

    let clipboardText = '';
    const originalClipboard = navigator.clipboard;
    Object.assign(navigator, {
      clipboard: {
        writeText: async (text: string) => {
          clipboardText = text;
        },
      },
    });

    try {
      await component['createModel']();
      fixture.detectChanges();

      const event = emittedEvent as { name: string; prompt: string; images: readonly string[] };
      expect(event).toBeDefined();
      expect(event.name).toBe('bicolor-black-and-white-cat');
      expect(event.prompt).toContain('bicolor black and white');
      expect(event.prompt).toContain('cat');
      expect(event.prompt).toContain('wings');
      expect(event.prompt).toContain('gold');
      expect(event.prompt).toContain('eyes');
      expect(event.prompt).toContain('green');
      expect(event.prompt.startsWith('a cute')).toBe(true);

      // Full studio prompt copied to clipboard with studio 3D/papercraft invariants
      expect(clipboardText).toContain(event.prompt);
      expect(clipboardText).toContain('standing naturally on all four paws');
      expect(clipboardText).toContain('pure low-poly papercraft cardstock facets');
    } finally {
      Object.assign(navigator, { clipboard: originalClipboard });
    }
  });

  it('updates prompt directly when onVoiceAccepted is triggered', () => {
    component['onVoiceAccepted']('dragão bebé verde com barriga dourada');
    expect(component.promptText()).toBe('dragão bebé verde com barriga dourada');
    expect(component.derivedFolderSlug()).toBe('dragon-baby-green');
  });
});
