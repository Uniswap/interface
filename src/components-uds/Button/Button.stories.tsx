import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Box } from 'src/components/layout'
import { Button, ButtonEmphasis, ButtonSize } from './Button'

export default {
  title: 'Components/Button',
  component: Button,
  decorators: [
    (Story) => (
      <Box m="lg">
        <Story />
      </Box>
    ),
  ],
  argTypes: {
    emphasis: {
      options: ['high', 'medium', 'low', 'destructive', 'warning'],
      control: { type: 'radio' },
      defaultValue: 'high',
    },
    state: {
      options: ['enabled', 'disabled'],
      control: { type: 'radio' },
      defaultValue: 'enabled',
    },
    size: {
      options: ['large', 'medium', 'small'],
      control: { type: 'radio' },
      defaultValue: 'medium',
    },
    type: {
      options: ['regular', 'icon', 'label'],
      control: { type: 'radio' },
      defaultValue: 'label',
    },
  },
} as ComponentMeta<typeof Button>

const Template: ComponentStory<typeof Button> = (props) => <Button {...props} />
export const DefaultButton = Template.bind({})
DefaultButton.args = {
  label: 'Default Button',
}

export const LargeHighEmphasisButton = Template.bind({})
LargeHighEmphasisButton.args = {
  ...DefaultButton.args,
  label: 'Large Button',
  emphasis: ButtonEmphasis.High,
  size: ButtonSize.Large,
}

export const MediumMediumEmphasisButton = Template.bind({})
MediumMediumEmphasisButton.args = {
  ...DefaultButton.args,
  label: 'Medium Medium Emphasis Button',
  emphasis: ButtonEmphasis.Medium,
  size: ButtonSize.Medium,
}

export const SmallLowEmphasisButton = Template.bind({})
SmallLowEmphasisButton.args = {
  ...DefaultButton.args,
  label: 'Small Low Emphasis Button',
  emphasis: ButtonEmphasis.Low,
  size: ButtonSize.Small,
}

export const LargeWarningButton = Template.bind({})
LargeWarningButton.args = {
  ...DefaultButton.args,
  label: 'Warning Button',
  emphasis: ButtonEmphasis.Warning,
  size: ButtonSize.Large,
}

export const LargeDestructiveButton = Template.bind({})
LargeDestructiveButton.args = {
  ...DefaultButton.args,
  label: 'Destructive Button',
  emphasis: ButtonEmphasis.Destructive,
  size: ButtonSize.Large,
}
