import { DOMAIN_ICONS } from './icons/domain-icons';
import { GLYPH_ICONS } from './icons/glyph-icons';
import { MASTER_ICONS } from './icons/master-icons';
import { OBJECT_ICONS } from './icons/object-icons';
import { PaperIcon } from './paper-icon';

export const PAPER_ICONS = {
  ...DOMAIN_ICONS,
  ...MASTER_ICONS,
  ...GLYPH_ICONS,
  ...OBJECT_ICONS,
} as const satisfies Readonly<Record<string, PaperIcon>>;

export type PictogramName = keyof typeof PAPER_ICONS;

export function isPictogramName(value: string): value is PictogramName {
  return value in PAPER_ICONS;
}

export const PICTOGRAM_NAMES: readonly PictogramName[] = Object.keys(PAPER_ICONS).filter(isPictogramName);
