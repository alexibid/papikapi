import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { SceneryComponent } from './scenery';

const meta: Meta<SceneryComponent> = {
  title: 'Organisms/Scenery',
  component: SceneryComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [SceneryComponent] })],
};
export default meta;

export const Stage: StoryObj<SceneryComponent> = {
  render: () => ({
    template: `
      <div style="position:relative;width:340px;height:520px;margin:40px;background:#efe1cc">
        <papikapi-scenery />
      </div>`,
  }),
};
