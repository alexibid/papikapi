import { StickerName } from '@ui/atoms/sticker/stickers';

export interface Ornament {
  readonly name: StickerName;
  readonly style: Readonly<Record<string, string>>;
}

function ornament(name: StickerName, left: number, top: number, width: number): Ornament {
  return { name, style: { left: `${left}%`, top: `${top}%`, width: `${width}%` } };
}

export const STAGE_ORNAMENTS: readonly Ornament[] = [
  ornament('cloud-a', -6.91, 27.04, 19.92),
  ornament('cloud-b', 93.9, 70.44, 11.79),
  ornament('cloud-c', 85.77, 91.64, 20.73),
  ornament('leaf-a', -5.39, 3.97, 11.79),
  ornament('leaf-b', -5.69, 11.75, 10.16),
  ornament('leaf-c', 95.53, 30.14, 10.06),
  ornament('leaf-d', -2.64, 83.99, 5.59),
  ornament('leaf-e', -4.37, 91.2, 10.37),
  ornament('star-a', 94.72, 23.5, 7.83),
  ornament('star-b', -3.46, 74.04, 6.61),
  ornament('star-c', 4.07, 96.25, 8.54),
  ornament('star-d', 0.5, 40, 5.69),
  ornament('star-e', 92.5, 40, 6.81),
  ornament('star-f', 1, 58, 6.3),
  ornament('shards-l', 0.5, 47, 7.72),
  ornament('shards-r', 88.5, 48, 10),
];
