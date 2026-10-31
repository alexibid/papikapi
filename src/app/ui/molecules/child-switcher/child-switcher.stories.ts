import type { Meta, StoryObj } from '@storybook/angular';
import { ChildSwitcherComponent } from './child-switcher';

const meta: Meta<ChildSwitcherComponent> = {
  title: 'Molecules/Child Switcher',
  component: ChildSwitcherComponent,
  tags: ['autodocs'],
};
export default meta;

export const Classroom: StoryObj<ChildSwitcherComponent> = {
  args: {
    children: [
      { id: 'ines', name: 'Inês', avatarBustUrl: 'scene/avatar.webp', paperColor: '#F8E4D6' },
      { id: 'tomas', name: 'Tomás', avatarBustUrl: 'scene/avatar.webp', paperColor: '#D6F0E0' },
      { id: 'leonor', name: 'Leonor', avatarBustUrl: '', paperColor: '#DBEAFE' },
    ],
    activeChildId: 'ines',
    switchLabel: 'Trocar de criança',
    closeLabel: 'Fechar',
  },
};
