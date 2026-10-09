import { describe, expect, it } from 'vitest';
import {
  STUDIO_MODEL_PRESETS,
  buildFullAiPrompt,
  buildModelPrompt,
  buildStudioNxCommand,
  buildStudioPrompt,
  composeFullAiPrompt,
  composeStudioPrompt,
  slugify,
} from './model-generation-prompts';

describe('model-generation-prompts', () => {
  describe('slugify', () => {
    it('normalizes accents and whitespace into kebab-case', () => {
      expect(slugify('O meu cão Tobias!')).toBe('o-meu-cao-tobias');
      expect(slugify('Dragão Bebé #1')).toBe('dragao-bebe-1');
      expect(slugify('  gato-preto  ')).toBe('gato-preto');
    });

    it('falls back to custom-model when input produces empty string', () => {
      expect(slugify('   ')).toBe('custom-model');
      expect(slugify('???')).toBe('custom-model');
    });
  });

  describe('composeStudioPrompt', () => {
    it('creates studio prompt without photos with zero floor shadow', () => {
      const prompt = composeStudioPrompt('o meu gato Tobias', 0);
      expect(prompt).toContain('a cute standing o meu gato Tobias');
      expect(prompt).toContain('zero floor shadow');
      expect(prompt).toContain('pure low-poly papercraft cardstock facets');
      expect(prompt).not.toContain('attached 3/4 reference photo');
    });

    it('includes 3/4 reference photo instructions when photo count is greater than zero', () => {
      const promptWith1 = composeStudioPrompt('o meu gato Tobias', 1);
      expect(promptWith1).toContain('1 attached 3/4 reference photo(s)');
      expect(promptWith1).toContain('proportions, fur colors, and exact markings');

      const promptWith3 = composeStudioPrompt('o meu gato Tobias', 3);
      expect(promptWith3).toContain('3 attached 3/4 reference photo(s)');
      expect(promptWith3).toContain('proportions, fur colors, and exact markings');
    });

    it('falls back to default subject when prompt is empty or blank', () => {
      const prompt = composeStudioPrompt('   ', 0);
      expect(prompt).toContain('a cute standing o meu gato');
    });
  });

  describe('composeFullAiPrompt', () => {
    it('includes mandatory studio invariants for AI generation', () => {
      const prompt = composeFullAiPrompt('o meu gato Tobias', 0);
      expect(prompt).toContain('EYE-LEVEL THREE-QUARTER VIEW');
      expect(prompt).toContain('STUDIO INVARIANTS (MANDATORY)');
      expect(prompt).toContain('ABSOLUTELY ZERO SHADOWS');
    });

    it('includes photo reference directives and 3/4 angle instructions', () => {
      const prompt = composeFullAiPrompt('o meu gato Tobias', 2);
      expect(prompt).toContain('SUBJECT REFERENCE PHOTOS (2 photo(s) of the real subject attached)');
      expect(prompt).toContain('Photos are taken from a 3/4 perspective');
      expect(prompt).toContain('Faithfully preserve the subject\'s identity, proportions, body shape, fur colors');
    });
  });

  describe('buildStudioNxCommand', () => {
    it('generates executable Nx command for studio stages pipeline', () => {
      const cmd = buildStudioNxCommand('meu-gato', 'a cute standing cat, zero floor shadow');
      expect(cmd).toBe(
        "nx run papikapi-studio:stages -- --model=meu-gato --prompt='a cute standing cat, zero floor shadow' --pick=3"
      );
    });
  });

  describe('backwards compatibility helpers', () => {
    it('buildStudioPrompt and buildModelPrompt return composed studio prompts', () => {
      expect(buildStudioPrompt('girafa')).toContain('girafa');
      expect(buildModelPrompt('girafa')).toContain('girafa');
      expect(buildFullAiPrompt('girafa')).toContain('girafa');
    });

    it('contains official studio presets with required properties', () => {
      expect(STUDIO_MODEL_PRESETS.length).toBeGreaterThan(0);
      for (const preset of STUDIO_MODEL_PRESETS) {
        expect(preset.id).toBeTruthy();
        expect(preset.label).toBeTruthy();
        expect(preset.slug).toBeTruthy();
        expect(preset.prompt).toContain('zero floor shadow');
      }
    });
  });
});
