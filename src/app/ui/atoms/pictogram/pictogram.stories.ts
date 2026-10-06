import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { PICTOGRAM_NAMES } from './paper-icons';
import { PictogramComponent } from './pictogram';

const meta: Meta<PictogramComponent> = {
  title: 'Atoms/Pictogram',
  component: PictogramComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [PictogramComponent] })],
};
export default meta;

export const Mascot: StoryObj<PictogramComponent> = { args: { name: 'mascot' } };
export const Toothbrush: StoryObj<PictogramComponent> = { args: { name: 'toothbrush' } };
export const Backpack: StoryObj<PictogramComponent> = { args: { name: 'backpack' } };
export const Check: StoryObj<PictogramComponent> = { args: { name: 'check' } };

export const Catalogue: StoryObj = {
  render: () => ({
    props: { names: PICTOGRAM_NAMES },
    template: `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,96px);gap:16px">
        @for (name of names; track name) {
          <figure style="margin:0;text-align:center;font:12px sans-serif">
            <div style="width:72px;height:72px;margin:auto"><papikapi-pictogram [name]="name" /></div>
            <figcaption>{{ name }}</figcaption>
          </figure>
        }
      </div>`,
  }),
};
