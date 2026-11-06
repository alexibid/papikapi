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

  it('should send the translated prompt exactly as the user said it, without adding cute', async () => {
    vi.spyOn(translationService, 'translate').mockResolvedValue('bicolor black and white cat with wings');

    const result = await service.describeFigure({ prompt: 'gato preto e branco com asas', customName: '' });

    expect(result.englishPrompt).toBe('bicolor black and white cat with wings');
  });

  it('should keep cute in the prompt when the user asked for it', async () => {
    vi.spyOn(translationService, 'translate').mockResolvedValue('a very cute lion');

    const result = await service.describeFigure({ prompt: 'um leão muito fofo', customName: '' });

    expect(result.englishPrompt).toBe('a very cute lion');
  });

  it('should drop articles, possessives, cute and adverbs from the display names', async () => {
    vi.spyOn(translationService, 'translate').mockResolvedValue('my very cute pink pig');

    const result = await service.describeFigure({ prompt: 'o meu porco cor-de-rosa muito fofo', customName: '' });

    expect(result.displayName).toEqual({ pt: 'Porco cor-de-rosa', en: 'Pink pig' });
  });

  it('should name the figure after the custom name when the user typed one', async () => {
    vi.spyOn(translationService, 'translate').mockImplementation(async (text: string) =>
      text === 'o meu gato Tobias' ? 'my cat Tobias' : 'a bicolor cat with a white blaze'
    );

    const result = await service.describeFigure({
      prompt: 'um gato bicolor com uma mancha branca',
      customName: 'o meu gato Tobias',
    });

    expect(result.displayName).toEqual({ pt: 'Gato Tobias', en: 'Cat Tobias' });
  });

  it('should enrich the iconic Snoopy character and keep the name short', async () => {
    vi.spyOn(translationService, 'translate').mockResolvedValue('Snoopy plush');

    const result = await service.describeFigure({ prompt: 'um peluche do Snoopy', customName: '' });

    expect(result.englishPrompt).toContain('long black floppy ears');
    expect(result.englishPrompt).toContain('small red collar');
    expect(result.displayName.en).toBe('Snoopy plush');
  });

  it('should enrich Pac-Man with its yellow body', () => {
    expect(service.enrichIconicSubject('pacman')).toContain('bright solid yellow spherical body');
  });

  it('should keep the original text when the translation service fails', async () => {
    vi.spyOn(translationService, 'translate').mockRejectedValue(new Error('Network offline'));

    const result = await service.describeFigure({ prompt: 'leão dourado', customName: '' });

    expect(result.englishPrompt).toBe('leão dourado');
    expect(result.displayName).toEqual({ pt: 'Leão dourado', en: 'Leão dourado' });
  });

  it('should keep the original text when the translation comes back empty', async () => {
    vi.spyOn(translationService, 'translate').mockResolvedValue('');

    const result = await service.describeFigure({ prompt: 'zebra', customName: '' });

    expect(result.englishPrompt).toBe('zebra');
  });

  it('should preview the portuguese display name while the user types', () => {
    expect(service.previewDisplayName({ prompt: 'um leão muito fofo', customName: '' })).toBe('Leão');
    expect(service.previewDisplayName({ prompt: 'um leão', customName: 'o meu Simba' })).toBe('Simba');
  });
});
