import { CanvasTexture, Sprite, SpriteMaterial } from 'three';

const TEXTURE_SIZE = 128;
const LABEL_SIZE = 0.034;
const EMPHASIS_SCALE = 1.45;

export class PieceLabel {
  readonly sprite: Sprite;

  private readonly plain: CanvasTexture;
  private readonly emphasised: CanvasTexture;

  constructor(text: string) {
    this.plain = paint(text, false);
    this.emphasised = paint(text, true);
    this.sprite = new Sprite(new SpriteMaterial({ map: this.plain, depthTest: false, sizeAttenuation: false }));
    this.sprite.renderOrder = 1;
    this.sprite.scale.setScalar(LABEL_SIZE);
  }

  emphasise(emphasised: boolean): void {
    this.sprite.material.map = emphasised ? this.emphasised : this.plain;
    this.sprite.scale.setScalar(emphasised ? LABEL_SIZE * EMPHASIS_SCALE : LABEL_SIZE);
    this.sprite.material.needsUpdate = true;
  }

  dispose(): void {
    this.plain.dispose();
    this.emphasised.dispose();
    this.sprite.material.dispose();
  }
}

function paint(text: string, emphasised: boolean): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const context = canvas.getContext('2d');
  if (context) {
    const middle = TEXTURE_SIZE / 2;
    context.beginPath();
    context.arc(middle, middle, middle - 6, 0, Math.PI * 2);
    context.fillStyle = emphasised ? '#1a1a1a' : '#ffffff';
    context.fill();
    context.lineWidth = 6;
    context.strokeStyle = '#1a1a1a';
    context.stroke();
    context.fillStyle = emphasised ? '#ffffff' : '#1a1a1a';
    context.font = `bold ${text.length > 1 ? 56 : 68}px sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, middle, middle + 4);
  }
  return new CanvasTexture(canvas);
}
