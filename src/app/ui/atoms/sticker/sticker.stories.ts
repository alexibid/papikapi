import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { StickerComponent } from './sticker';
import { STICKER_NAMES } from './stickers';

const meta: Meta<StickerComponent> = {
  title: 'Atoms/Sticker',
  component: StickerComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [StickerComponent] })],
};
export default meta;

export const Avatar: StoryObj<StickerComponent> = { args: { name: 'avatar' } };

export const Catalogue: StoryObj = {
  render: () => ({
    props: { names: STICKER_NAMES },
    template: `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,120px);gap:16px;background:#f1ddc5;padding:16px">
        @for (name of names; track name) {
          <figure style="margin:0;text-align:center;font:12px sans-serif">
            <div style="width:96px;height:96px;margin:auto"><papikapi-sticker [name]="name" /></div>
            <figcaption>{{ name }}</figcaption>
          </figure>
        }
      </div>`,
  }),
};
