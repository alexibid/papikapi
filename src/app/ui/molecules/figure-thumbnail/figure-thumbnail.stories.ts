import type { Meta, StoryObj } from '@storybook/angular';
import { FigureThumbnailComponent } from './figure-thumbnail';

const meta: Meta<FigureThumbnailComponent> = {
  title: 'Molecules/Figure Thumbnail',
  component: FigureThumbnailComponent,
  tags: ['autodocs'],
};
export default meta;

export const TRex: StoryObj<FigureThumbnailComponent> = { args: { figureId: 't-rex' } };
export const Fox: StoryObj<FigureThumbnailComponent> = { args: { figureId: 'fox' } };
