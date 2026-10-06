import type { Meta, StoryObj } from '@storybook/angular';
import { GradeTileComponent } from './grade-tile';

const meta: Meta<GradeTileComponent> = {
  title: 'Molecules/Grade Tile',
  component: GradeTileComponent,
  tags: ['autodocs'],
};
export default meta;

export const Maths: StoryObj<GradeTileComponent> = {
  args: { grade: { id: 'm', subject: 'Matemática', score: 4.8, letter: 'A' } },
};
