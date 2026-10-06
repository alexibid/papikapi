export const STICKER_NAMES = [
  'avatar',
  'sound',
  'photo',
  'cube',
  'play',
  'check',
  'bar',
  'cloud-a',
  'cloud-b',
  'cloud-c',
  'leaf-a',
  'leaf-b',
  'leaf-c',
  'leaf-d',
  'leaf-e',
  'star-a',
  'star-b',
  'star-c',
  'star-d',
  'star-e',
  'star-f',
  'shards-l',
  'shards-r',
  'paw-red',
  'paw-orange',
  'paw-lime',
  'paw-green',
  'paw-teal',
  'paw-blue',
  'task-toothbrush',
  'task-bed',
  'task-backpack',
  'task-plate',
] as const;

export type StickerName = (typeof STICKER_NAMES)[number];

export function stickerUrl(name: StickerName): string {
  return `scene/${name}.webp`;
}
