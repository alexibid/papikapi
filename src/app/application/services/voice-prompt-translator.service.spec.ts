import { TestBed } from '@angular/core/testing';
import { TranslationService } from '@ibid/services';
import { VoicePromptTranslatorService } from './voice-prompt-translator.service';

describe('VoicePromptTranslatorService', () => {
  let service: VoicePromptTranslatorService;
  let translationService: TranslationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VoicePromptTranslatorService);
    translationService = TestBed.inject(TranslationService);
  });

  it('translates Portuguese input to English studio prompt via TranslationService', async () => {
    vi.spyOn(translationService, 'translate').mockResolvedValue('bicolor black and white cat with wings');

    const result = await service.translateAndStructure('gato preto e branco com asas');

    expect(result.originalText).toBe('gato preto e branco com asas');
    expect(result.englishPrompt).toBe('a cute bicolor black and white cat with wings');
    expect(result.suggestedSlug).toBe('bicolor-black-and-white-cat');
  });

  it('preserves existing cute prefix without duplicating it', async () => {
    vi.spyOn(translationService, 'translate').mockResolvedValue('a cute baby dragon');

    const result = await service.translateAndStructure('um dragão bebé fofo');

    expect(result.englishPrompt).toBe('a cute baby dragon');
    expect(result.suggestedSlug).toBe('baby-dragon');
  });

  it('never produces duplicate "a cute cute" when input already contains cute', async () => {
    vi.spyOn(translationService, 'translate').mockResolvedValue('cute white dog in plush');

    const result = await service.translateAndStructure('cão branco peluche bonito');

    expect(result.englishPrompt).toBe('a cute white dog in plush');
    expect(result.englishPrompt).not.toContain('cute cute');
  });

  it('enriches iconic Snoopy character with canonical physical traits and produces snoopy-plush slug', async () => {
    vi.spyOn(translationService, 'translate').mockResolvedValue('white dog Snoopy in plush');

    const result = await service.translateAndStructure('um peluche do Snoopy cão branco');

    expect(result.englishPrompt).toContain('Snoopy');
    expect(result.englishPrompt).toContain('white body');
    expect(result.englishPrompt).toContain('long black floppy ears');
    expect(result.englishPrompt).toContain('round black nose tip');
    expect(result.englishPrompt).toContain('small red collar');
    expect(result.suggestedSlug).toBe('snoopy-plush');
  });

  it('handles empty input gracefully', async () => {
    const result = await service.translateAndStructure('');
    expect(result.englishPrompt).toBe('');
    expect(result.suggestedSlug).toBe('');
    expect(result.originalText).toBe('');
  });

  it('derives English slug even if translation service fails (offline dictionary fallback)', async () => {
    vi.spyOn(translationService, 'translate').mockRejectedValue(new Error('Network offline'));

    const result = await service.translateAndStructure('leão dourado');

    expect(result.originalText).toBe('leão dourado');
    expect(result.englishPrompt).toBe('a cute leão dourado');
    expect(result.suggestedSlug).toBe('lion-gold');
  });

  it('derives English slugs for Portuguese phrases via deriveEnglishSlug', () => {
    expect(service.deriveEnglishSlug('um peluche do Snoopy')).toBe('snoopy-plush');
    expect(service.deriveEnglishSlug('Snoopy')).toBe('snoopy');
    expect(service.deriveEnglishSlug('dragão bebé verde')).toBe('dragon-baby-green');
    expect(service.deriveEnglishSlug('cão')).toBe('dog');
    expect(service.deriveEnglishSlug('Cat Darth')).toBe('cat-darth');
    expect(service.deriveEnglishSlug('')).toBe('');
  });

  it('translates custom model name to English slug via translateNameToSlug', async () => {
    vi.spyOn(translationService, 'translate').mockImplementation(async (text: string) => {
      if (text === 'Gato Preto') return 'Black Cat';
      if (text === 'Peluche do Snoopy') return 'Snoopy Plush';
      return text;
    });

    const slug1 = await service.translateNameToSlug('Gato Preto');
    expect(slug1).toBe('black-cat');

    const slug2 = await service.translateNameToSlug('Peluche do Snoopy');
    expect(slug2).toBe('snoopy-plush');
  });
});
