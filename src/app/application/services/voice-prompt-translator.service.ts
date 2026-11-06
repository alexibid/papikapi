import { Injectable, inject } from '@angular/core';
import { TranslationService } from '@ibid/services';
import { FigureDisplayNames, figureDisplayName } from '@ibid/utils';

export interface FigureDescription {
  readonly englishPrompt: string;
  readonly displayName: FigureDisplayNames;
}

export interface FigureDescriptionRequest {
  readonly prompt: string;
  readonly customName: string;
}

@Injectable({ providedIn: 'root' })
export class VoicePromptTranslatorService {
  private readonly translationService = inject(TranslationService);

  async describeFigure(request: FigureDescriptionRequest): Promise<FigureDescription> {
    const prompt = request.prompt.trim();
    const customName = request.customName.trim();
    const [englishPrompt, englishName] = await Promise.all([
      this.toEnglish(prompt),
      customName ? this.toEnglish(customName) : Promise.resolve(''),
    ]);
    return {
      englishPrompt: this.enrichIconicSubject(englishPrompt),
      displayName: {
        pt: figureDisplayName(customName || prompt, 'pt'),
        en: figureDisplayName(englishName || englishPrompt, 'en'),
      },
    };
  }

  previewDisplayName(request: FigureDescriptionRequest): string {
    return figureDisplayName(request.customName.trim() || request.prompt.trim(), 'pt');
  }

  enrichIconicSubject(text: string): string {
    if (/\b(snoopy|snoopi)\b/i.test(text) && !/\b(ears|orelhas|nose|nariz)\b/i.test(text)) {
      return `${text}, white body, long black floppy ears, round black nose tip, black eye spots, small red collar`;
    }
    if (/\b(pac-man|pacman)\b/i.test(text) && !/\b(yellow|amarelo)\b/i.test(text)) {
      return `${text}, bright solid yellow spherical body with iconic open wedge mouth`;
    }
    return text;
  }

  private async toEnglish(text: string): Promise<string> {
    if (!text) return '';
    try {
      const translated = await this.translationService.translate(text, 'pt', 'en');
      return (translated || text).trim();
    } catch {
      return text;
    }
  }
}
