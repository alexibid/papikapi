import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { BalloonBunchComponent } from './balloon-bunch';

const meta: Meta<BalloonBunchComponent> = {
  title: 'Organisms/BalloonBunch',
  component: BalloonBunchComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [BalloonBunchComponent] })],
};
export default meta;

export const Bunch: StoryObj<BalloonBunchComponent> = {
  render: () => ({
    template: '<div style="width:260px;padding:24px;background:#edd9c1"><papikapi-balloon-bunch /></div>',
  }),
};
