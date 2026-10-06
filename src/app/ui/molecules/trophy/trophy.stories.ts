import type { Meta, StoryObj } from '@storybook/angular';
import { TrophyComponent } from './trophy';

const meta: Meta<TrophyComponent> = {
  title: 'Molecules/Trophy',
  component: TrophyComponent,
  tags: ['autodocs'],
};
export default meta;

const base = { id: 't-rex', figureId: 't-rex', piecesBuilt: 0, piecesTotal: 0 } as const;

export const Mounted: StoryObj<TrophyComponent> = {
  args: { trophy: { ...base, state: 'mounted' } },
};
export const Building: StoryObj<TrophyComponent> = {
  args: { trophy: { ...base, state: 'building', piecesBuilt: 3, piecesTotal: 4 } },
};
export const Queued: StoryObj<TrophyComponent> = {
  args: { trophy: { ...base, state: 'queued' } },
};
