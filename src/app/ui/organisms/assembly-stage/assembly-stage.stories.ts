import type { Meta, StoryObj } from '@storybook/angular';
import { AssemblyStageComponent } from './assembly-stage';

const meta: Meta<AssemblyStageComponent> = {
  title: 'Organisms/Assembly Stage',
  component: AssemblyStageComponent,
  tags: ['autodocs'],
};
export default meta;

export const Resting: StoryObj<AssemblyStageComponent> = {
  args: { source: '/figures/t-rex/assembly.json', progress: 0 },
};
export const Halfway: StoryObj<AssemblyStageComponent> = {
  args: { source: '/figures/t-rex/assembly.json', built: 20 },
};
export const Complete: StoryObj<AssemblyStageComponent> = {
  args: { source: '/figures/t-rex/assembly.json', built: 39 },
};
