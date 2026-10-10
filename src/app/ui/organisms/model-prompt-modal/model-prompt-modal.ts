import { Component, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent, HandDrawnDirective } from 'ibid-ui';
import { I18nService } from '@ibid/services';
import {
  MODEL_NEGATIVE_PROMPT,
  MODEL_SYSTEM_PROMPT,
  ReferencePhoto,
  composeStudioPrompt,
  slugify,
} from '@domain/data/model-generation-prompts';
import { PictogramComponent } from '@ui/atoms/pictogram/pictogram';

export type PromptTab = 'studio' | 'user' | 'system' | 'negative' | 'full' | 'command';

@Component({
  selector: 'papikapi-model-prompt-modal',
  standalone: true,
  imports: [ButtonComponent, FormsModule, HandDrawnDirective, PictogramComponent],
  templateUrl: './model-prompt-modal.html',
  styleUrl: './model-prompt-modal.scss',
})
export class ModelPromptModalComponent {
  protected readonly i18n = inject(I18nService);

  readonly dismissed = output<void>();
  readonly modelCreated = output<{ name: string; prompt: string; images: readonly string[] }>();

  readonly promptText = signal('');
  // Backwards compatibility alias for tests
  readonly subject = this.promptText;

  readonly modelName = signal('');

  readonly derivedFolderSlug = computed(() => {
    const custom = this.modelName().trim();
    if (custom) {
      return slugify(custom).slice(0, 32).replace(/-+$/, '') || 'papikapi-model';
    }
    const base = this.promptText().trim();
    return slugify(base).slice(0, 24).replace(/-+$/, '') || 'papikapi-model';
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
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const remainingSlots = 3 - this.photos().length;
    const selectedFiles = Array.from(input.files).slice(0, remainingSlots);

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
    input.value = '';
  }

  protected removePhoto(id: string): void {
    this.photos.update((current) => current.filter((p) => p.id !== id));
  }

  protected async createModel(): Promise<void> {
    const prompt = this.promptText().trim();
    if (!prompt || this.isCreating()) return;

    this.isCreating.set(true);
    this.errorMessage.set('');
    this.statusMessage.set('');

    const name = this.derivedFolderSlug();
    const images = this.photos().map((p) => p.dataUrl);

    try {
      const fullPrompt = composeStudioPrompt(prompt, images.length);
      await navigator.clipboard.writeText(fullPrompt);
    } catch {
      // Clipboard fallback
    }


    this.statusMessage.set(this.i18n.translate('modelCreatedSuccess'));
    this.modelCreated.emit({ name, prompt, images });
    this.close();
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

  protected setTab(tab: PromptTab): void {
    this.activeTab.set(tab);
  }

  protected close(): void {
    this.dismissed.emit();
  }
}
