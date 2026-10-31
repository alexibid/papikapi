import type { Meta, StoryObj } from '@storybook/angular';
import { ChildBustComponent } from './child-bust';

const meta: Meta<ChildBustComponent> = {
  title: 'Atoms/Child Bust',
  component: ChildBustComponent,
  tags: ['autodocs'],
};
export default meta;

export const WithBust: StoryObj<ChildBustComponent> = {
  args: {
    child: { id: 'ines', name: 'Inês', avatarBustUrl: 'scene/avatar.webp', paperColor: '#F8E4D6' },
  },
};

export const WithoutBust: StoryObj<ChildBustComponent> = {
  args: {
    child: { id: 'leonor', name: 'Leonor', avatarBustUrl: '', paperColor: '#DBEAFE' },
  },
};
