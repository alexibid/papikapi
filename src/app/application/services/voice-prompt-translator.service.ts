import { Injectable, inject } from '@angular/core';
import { TranslationService } from '@ibid/services';

export interface TranslatedPromptResult {
  readonly originalText: string;
  readonly englishPrompt: string;
  readonly suggestedSlug: string;
}

const PT_TO_EN_DICTIONARY: Readonly<Record<string, string>> = {
  // Animals
  cao: 'dog',
  cachorro: 'dog',
  canino: 'dog',
  cachorrinho: 'puppy',
  gato: 'cat',
  gata: 'cat',
  gatinho: 'kitten',
  gatinha: 'kitten',
  peluche: 'plush',
  pelucia: 'plush',
  boneco: 'toy',
  boneca: 'doll',
  urso: 'bear',
  ursinho: 'bear-cub',
  leao: 'lion',
  leoa: 'lion',
  tigre: 'tiger',
  elefante: 'elephant',
  girafa: 'giraffe',
  dinossauro: 'dinosaur',
  dino: 'dino',
  tubarao: 'shark',
  golfinho: 'dolphin',
  tartaruga: 'turtle',
  coelho: 'rabbit',
  coelhinho: 'rabbit',
  cavalo: 'horse',
  pato: 'duck',
  patinho: 'duckling',
  porco: 'pig',
  porquinho: 'piglet',
  vaca: 'cow',
  vaquinha: 'cow',
  ovelha: 'sheep',
  macaco: 'monkey',
  raposa: 'fox',
  lobo: 'wolf',
  passaro: 'bird',
  ave: 'bird',
  peixe: 'fish',
  peixinho: 'fish',
  panda: 'panda',
  koala: 'koala',
  coala: 'koala',
  coruja: 'owl',
  esquilo: 'squirrel',
  zebra: 'zebra',
  foca: 'seal',
  pinguim: 'penguin',
  polvo: 'octopus',
  dragao: 'dragon',
  unicornio: 'unicorn',
  monstro: 'monster',
  robo: 'robot',

  // Vehicles
  carro: 'car',
  carrinho: 'car',
  camiao: 'truck',
  caminhao: 'truck',
  bombeiros: 'fire-truck',
  policia: 'police-car',
  comboio: 'train',
  trem: 'train',
  aviao: 'plane',
  barco: 'boat',
  navio: 'ship',
  submarino: 'submarine',
  foguete: 'rocket',
  nave: 'spaceship',
  trator: 'tractor',

  // Colors
  preto: 'black',
  preta: 'black',
  pretos: 'black',
  pretas: 'black',
  branco: 'white',
  branca: 'white',
  brancos: 'white',
  brancas: 'white',
  azul: 'blue',
  azuis: 'blue',
  vermelho: 'red',
  vermelha: 'red',
  vermelhos: 'red',
  vermelhas: 'red',
  amarelo: 'yellow',
  amarela: 'yellow',
  amarelos: 'yellow',
  amarelas: 'yellow',
  verde: 'green',
  verdes: 'green',
  castanho: 'brown',
  castanha: 'brown',
  marrom: 'brown',
  cinzento: 'grey',
  cinzenta: 'grey',
  cinza: 'grey',
  rosa: 'pink',
  roxo: 'purple',
  roxa: 'purple',
  laranja: 'orange',
  dourado: 'gold',
  dourada: 'gold',
  prateado: 'silver',
  prateada: 'silver',

  // Modifiers
  bebe: 'baby',
  filhote: 'cub',
  pequeno: 'little',
  pequena: 'little',
  grande: 'big',
  fofo: 'cute',
  fofinho: 'cute',
  engracado: 'funny',
  divertido: 'funny',
  voador: 'winged',
  voadora: 'winged',
  asa: 'wings',
  asas: 'wings',
  bicolor: 'bicolor',
  tuxedo: 'tuxedo',
  barriga: 'belly',
  olho: 'eyes',
  olhos: 'eyes',
  orelha: 'ears',
  orelhas: 'ears',
  cauda: 'tail',
  rabo: 'tail',
};

const STOP_WORDS = new Set([
  'um',
  'uma',
  'uns',
  'umas',
  'o',
  'a',
  'os',
  'as',
  'de',
  'do',
  'da',
  'dos',
  'das',
  'em',
  'no',
  'na',
  'nos',
  'nas',
  'meu',
  'minha',
  'meus',
  'minhas',
  'seu',
  'sua',
  'com',
  'e',
  'que',
  'para',
  'por',
  'tipo',
  'estilo',
  'cute',
]);

@Injectable({ providedIn: 'root' })
export class VoicePromptTranslatorService {
  private readonly translationService = inject(TranslationService);

  async translateAndStructure(sourceText: string): Promise<TranslatedPromptResult> {
    const trimmed = sourceText.trim();
    if (!trimmed) {
      return { originalText: '', englishPrompt: '', suggestedSlug: '' };
    }

    try {
      const translated = await this.translationService.translate(trimmed, 'pt', 'en');
      let englishPrompt = (translated || trimmed).trim();

      englishPrompt = this.enrichIconicSubject(englishPrompt);
      englishPrompt = this.normalizeCutePrefix(englishPrompt);

      const slug = this.deriveEnglishSlug(englishPrompt);
      return {
        originalText: trimmed,
        englishPrompt,
        suggestedSlug: slug,
      };
    } catch {
      let fallbackPrompt = this.enrichIconicSubject(trimmed);
      fallbackPrompt = this.normalizeCutePrefix(fallbackPrompt);
      return {
        originalText: trimmed,
        englishPrompt: fallbackPrompt,
        suggestedSlug: this.deriveEnglishSlug(trimmed),
      };
    }
  }

  async translateNameToSlug(name: string): Promise<string> {
    const trimmed = name.trim();
    if (!trimmed) return '';

    try {
      const translated = await this.translationService.translate(trimmed, 'pt', 'en');
      const english = (translated || trimmed).trim();
      return this.deriveEnglishSlug(english);
    } catch {
      return this.deriveEnglishSlug(trimmed);
    }
  }

  deriveEnglishSlug(text: string): string {
    const trimmed = text.trim();
    if (!trimmed) return '';

    const primary = trimmed.split(/[,;.]|\s+(?:com|with)\s+/i)[0].trim();

    if (/\b(snoopy|snoopi)\b/i.test(primary)) {
      return /\b(peluche|pelucia|plush|boneco)\b/i.test(primary) ? 'snoopy-plush' : 'snoopy';
    }
    if (/\b(pac-man|pacman)\b/i.test(primary)) {
      return 'pac-man';
    }
    if (/\b(mario)\b/i.test(primary)) {
      return 'mario';
    }
    if (/\b(sonic)\b/i.test(primary)) {
      return 'sonic';
    }
    if (/\b(pikachu)\b/i.test(primary)) {
      return 'pikachu';
    }
    if (/\b(kirby)\b/i.test(primary)) {
      return 'kirby';
    }
    if (/\b(yoshi)\b/i.test(primary)) {
      return 'yoshi';
    }
    if (/\b(darth)\b/i.test(primary)) {
      return /\b(cat|gato)\b/i.test(primary) ? 'cat-darth' : 'darth';
    }

    const normalized = primary
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean);
    const translated: string[] = [];

    for (const token of tokens) {
      if (token in PT_TO_EN_DICTIONARY) {
        translated.push(PT_TO_EN_DICTIONARY[token]);
      } else if (!STOP_WORDS.has(token)) {
        translated.push(token);
      }
    }

    const candidate = translated.join('-');
    return (
      candidate
        .replace(/\ba-cute-/i, '')
        .replace(/\bcute-/i, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 64)
        .replace(/-+$/, '') || 'model'
    );
  }

  normalizeCutePrefix(text: string): string {
    let clean = text.trim();
    // Collapse any duplicated "cute cute" or "a cute cute"
    clean = clean.replace(/\b(a\s+)?(cute\s+)+(cute\b)/gi, 'cute');
    if (!/\bcute\b/i.test(clean)) {
      clean = `cute ${clean}`;
    }
    if (!/^a\s+/i.test(clean)) {
      clean = `a ${clean}`;
    }
    return clean.replace(/\s{2,}/g, ' ').replace(/^a\s+a\s+/i, 'a ');
  }

  enrichIconicSubject(text: string): string {
    let result = text;
    if (/\b(snoopy|snoopi)\b/i.test(result) && !/\b(ears|orelhas|nose|nariz)\b/i.test(result)) {
      result = `${result}, white body, long black floppy ears, round black nose tip, black eye spots, small red collar`;
    } else if (/\b(pac-man|pacman)\b/i.test(result) && !/\b(yellow|amarelo)\b/i.test(result)) {
      result = `${result}, bright solid yellow spherical body with iconic open wedge mouth`;
    }
    return result;
  }
}
