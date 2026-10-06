import type { Meta, StoryObj } from '@storybook/angular';
import { TaskCardComponent } from './task-card';

const meta: Meta<TaskCardComponent> = {
  title: 'Molecules/Task Card',
  component: TaskCardComponent,
  tags: ['autodocs'],
};
export default meta;

export const Done: StoryObj<TaskCardComponent> = {
  args: { task: { id: 'teeth', pictogram: 'toothbrush', status: 'done' } },
};
export const Next: StoryObj<TaskCardComponent> = {
  args: { task: { id: 'bag', pictogram: 'backpack', status: 'next' } },
};
export const Upcoming: StoryObj<TaskCardComponent> = {
  args: { task: { id: 'plate', pictogram: 'plate', status: 'upcoming' } },
};
