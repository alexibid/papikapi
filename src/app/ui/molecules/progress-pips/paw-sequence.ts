import { StickerName } from '@ui/atoms/sticker/stickers';

const PAWS: readonly StickerName[] = [
  'paw-red',
  'paw-orange',
  'paw-lime',
  'paw-green',
  'paw-teal',
  'paw-blue',
];

export function pawFor(position: number): StickerName {
  return PAWS[position % PAWS.length];
}
