import type { Meta, StoryObj } from '@storybook/angular';
import { ProgressPipsComponent } from './progress-pips';

const meta: Meta<ProgressPipsComponent> = {
  title: 'Molecules/Progress Pips',
  component: ProgressPipsComponent,
  tags: ['autodocs'],
};
export default meta;

export const Resting: StoryObj<ProgressPipsComponent> = { args: { total: 4, filled: 0 } };
export const Halfway: StoryObj<ProgressPipsComponent> = { args: { total: 4, filled: 2 } };
export const Complete: StoryObj<ProgressPipsComponent> = { args: { total: 4, filled: 4 } };
