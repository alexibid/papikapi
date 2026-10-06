import type { Meta, StoryObj } from '@storybook/angular';
import { AgendaItemComponent } from './agenda-item';

const meta: Meta<AgendaItemComponent> = {
  title: 'Molecules/Agenda Item',
  component: AgendaItemComponent,
  tags: ['autodocs'],
};
export default meta;

export const Meeting: StoryObj<AgendaItemComponent> = {
  args: {
    event: { id: 'm', title: 'Reunião de pais', detail: 'Hoje · 17:30', kind: 'meeting' },
    kindLabel: 'Alerta',
  },
};
