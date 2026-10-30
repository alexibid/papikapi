import {
  afterNextRender,
  Component,
  computed,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ButtonComponent,
  FocusStateDirective,
  FormFieldComponent,
  FormOrchestratorDirective,
  HandDrawnDirective,
  TactileDirective,
  TextareaComponent,
  TextInputComponent,
  VoiceDictationComponent,
} from 'ibid-ui';
import {
  I18nService,
  SpeechRecognitionService,
  SpeechRecognitionState,
} from '@ibid/services';
import {
  MODEL_NEGATIVE_PROMPT,
  MODEL_SYSTEM_PROMPT,
  ReferencePhoto,
  composeStudioPrompt,
} from '@domain/data/model-generation-prompts';
import { VoicePromptTranslatorService } from '@application/services/voice-prompt-translator.service';
import { PictogramComponent } from '@ui/atoms/pictogram/pictogram';

export type PromptTab = 'studio' | 'user' | 'system' | 'negative' | 'full' | 'command';

@Component({
  selector: 'papikapi-model-prompt-modal',
  standalone: true,
  imports: [
    ButtonComponent,
    FocusStateDirective,
    FormFieldComponent,
    FormOrchestratorDirective,
    FormsModule,
    HandDrawnDirective,
    PictogramComponent,
    TactileDirective,
    TextareaComponent,
    TextInputComponent,
    VoiceDictationComponent,
  ],
  templateUrl: './model-prompt-modal.html',
  styleUrl: './model-prompt-modal.scss',
})
export class ModelPromptModalComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly speech = inject(SpeechRecognitionService);
  protected readonly promptTranslator = inject(VoicePromptTranslatorService);

  private readonly modelNameField = viewChild<TextInputComponent>('modelNameField');

  readonly dismissed = output<void>();
  readonly modelCreated = output<{ name: string; prompt: string; images: readonly string[] }>();

  readonly promptText = signal('');
  readonly subject = this.promptText;
  readonly modelName = signal('');
  readonly isWritingVoice = signal(false);
  readonly voiceNotice = signal('');
  private basePromptBeforeDictation = '';

  constructor() {
    afterNextRender(() => this.modelNameField()?.focus());
  }

  readonly derivedFolderSlug = computed(() => {
    const custom = this.modelName().trim();
    const source = custom || this.promptText().trim();
    return this.promptTranslator.deriveEnglishSlug(source) || 'papikapi-model';
  });

  readonly photos = signal<readonly ReferencePhoto[]>([]);
  readonly isCreating = signal(false);
  readonly statusMessage = signal('');
  readonly errorMessage = signal('');
  readonly copied = signal(false);

  readonly systemPrompt = MODEL_SYSTEM_PROMPT;
  readonly negativePrompt = MODEL_NEGATIVE_PROMPT;
  readonly activeTab = signal<PromptTab>('studio');

  readonly userPrompt = computed(() =>
    composeStudioPrompt(this.promptText(), this.photos().length)
  );

  readonly currentContent = computed(() => {
    switch (this.activeTab()) {
      case 'system':
        return this.systemPrompt;
      case 'negative':
        return this.negativePrompt;
      default:
        return this.userPrompt();
    }
  });

  protected onFileSelect(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    if (!inputEl.files || inputEl.files.length === 0) return;

    const remainingSlots = 3 - this.photos().length;
    const selectedFiles = Array.from(inputEl.files).slice(0, remainingSlots);

    for (const file of selectedFiles) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const photo: ReferencePhoto = {
            id: Math.random().toString(36).substring(2, 9),
            name: file.name,
            dataUrl: reader.result,
          };
          this.photos.update((current) => {
            if (current.length >= 3) return current;
            return [...current, photo];
          });
        }
      };
      reader.readAsDataURL(file);
    }
    inputEl.value = '';
  }

  protected removePhoto(id: string): void {
    this.photos.update((current) => current.filter((p) => p.id !== id));
  }

  protected async createModel(): Promise<void> {
    const rawPrompt = this.promptText().trim();
    if (!rawPrompt || this.isCreating()) return;

    this.isCreating.set(true);
    this.errorMessage.set('');
    this.statusMessage.set('');

    const rawCustomName = this.modelName().trim();
    const images = this.photos().map((p) => p.dataUrl);

    try {
      // Translation is done upon submission/sending
      const [translated, customSlug] = await Promise.all([
        this.promptTranslator.translateAndStructure(rawPrompt),
        rawCustomName
          ? this.promptTranslator.translateNameToSlug(rawCustomName)
          : Promise.resolve(''),
      ]);

      const englishPrompt = translated.englishPrompt || rawPrompt;
      const name =
        customSlug ||
        translated.suggestedSlug ||
        this.promptTranslator.deriveEnglishSlug(rawPrompt) ||
        'papikapi-model';

      const fullPrompt = composeStudioPrompt(englishPrompt, images.length);
      try {
        await navigator.clipboard.writeText(fullPrompt);
      } catch {
        // Clipboard write may fail in headless test environments
      }

      this.statusMessage.set(this.i18n.translate('modelCreatedSuccess'));
      this.modelCreated.emit({ name, prompt: englishPrompt, images });
      this.close();
    } catch {
      // Graceful fallback if translation fails
      const fallbackName =
        this.promptTranslator.deriveEnglishSlug(rawCustomName || rawPrompt) || 'papikapi-model';
      const fallbackPrompt = composeStudioPrompt(
        this.promptTranslator.enrichIconicSubject(rawPrompt),
        images.length
      );
      try {
        await navigator.clipboard.writeText(fallbackPrompt);
      } catch {
        // Safe ignore
      }
      this.statusMessage.set(this.i18n.translate('modelCreatedSuccess'));
      this.modelCreated.emit({ name: fallbackName, prompt: fallbackPrompt, images });
      this.close();
    } finally {
      this.isCreating.set(false);
    }
  }

  protected async copyCurrent(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.currentContent());
      this.copied.set(true);
      window.setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.copied.set(false);
    }
  }

  protected onVoiceStateChange(state: SpeechRecognitionState): void {
    if (state === 'recording' && !this.basePromptBeforeDictation && this.promptText().trim()) {
      this.basePromptBeforeDictation = this.promptText().trim();
    } else if (state === 'idle') {
      this.basePromptBeforeDictation = '';
    }
  }

  protected onVoiceStream(streamedText: string): void {
    if (!streamedText) return;
    const fullText = this.basePromptBeforeDictation
      ? `${this.basePromptBeforeDictation} ${streamedText}`.trim()
      : streamedText;

    this.promptText.set(fullText);
  }

  protected onPromptTextManualChange(manualText: string): void {
    this.promptText.set(manualText);
    this.basePromptBeforeDictation = '';
    if (this.speech.state() === 'paused' || this.speech.state() === 'recording') {
      this.speech.updateTranscript(manualText);
    }
  }

  protected onVoiceAccepted(dictatedText: string): void {
    this.basePromptBeforeDictation = '';
    const text = dictatedText.trim() || this.promptText().trim();
    if (!text) return;
    this.promptText.set(text);
    this.voiceNotice.set(text);
  }

  protected async toggleVoiceDictation(): Promise<void> {
    if (this.speech.isListening()) {
      this.speech.stopListening();
      return;
    }

    this.errorMessage.set('');
    this.voiceNotice.set('');

    try {
      const rawText = await this.speech.startListening({ lang: 'pt-PT' });
      if (!rawText) return;

      this.isWritingVoice.set(true);
      // Write to prompt in the spoken/chosen language
      this.promptText.set(rawText);
      this.voiceNotice.set(rawText);
    } catch (err: unknown) {
      if (err instanceof Error && err.message !== 'no-speech') {
        this.errorMessage.set(err.message);
      }
    } finally {
      this.isWritingVoice.set(false);
    }
  }

  protected setTab(tab: PromptTab): void {
    this.activeTab.set(tab);
  }

  protected close(): void {
    this.dismissed.emit();
  }
}
