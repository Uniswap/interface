import { ComponentStory, Meta } from '@storybook/react'
import React from 'react'
import { Flex } from 'ui/src'
import SendIcon from 'ui/src/assets/icons/send-action.svg'
import { Button, ButtonEmphasis, ButtonSize } from './Button'

export default {
  title: 'Components/Button',
  component: Button,
  decorators: [
    (Story): JSX.Element => (
      <Flex m="$spacing24">
        <Story />
      </Flex>
    ),
  ],
  argTypes: {
    emphasis: {
      options: ['primary', 'secondary', 'tertiary', 'detrimental', 'warning'],
      control: { type: 'radio' },
      defaultValue: 'primary',
    },
    size: {
      options: ['large', 'medium', 'small'],
      control: { type: 'radio' },
      defaultValue: 'medium',
    },
  },
} as Meta<typeof Button>

const Template: ComponentStory<typeof Button> = (props) => <Button {...props} />
export const DefaultButton = Template.bind({})
DefaultButton.args = {
  label: 'Default Button',
}

export const LargePrimaryEmphasisButton = Template.bind({})
LargePrimaryEmphasisButton.args = {
  ...DefaultButton.args,
  label: 'Large Button',
  emphasis: ButtonEmphasis.Primary,
  size: ButtonSize.Large,
}

export const MediumSecondaryEmphasisButton = Template.bind({})
MediumSecondaryEmphasisButton.args = {
  ...DefaultButton.args,
  label: 'Medium Secondary Emphasis Button',
  emphasis: ButtonEmphasis.Secondary,
  size: ButtonSize.Medium,
}

export const SmallTertiaryEmphasisButton = Template.bind({})
SmallTertiaryEmphasisButton.args = {
  ...DefaultButton.args,
  label: 'Small Tertiary Emphasis Button',
  emphasis: ButtonEmphasis.Tertiary,
  size: ButtonSize.Small,
}

export const LargeWarningButton = Template.bind({})
LargeWarningButton.args = {
  ...DefaultButton.args,
  label: 'Warning Button',
  emphasis: ButtonEmphasis.Warning,
  size: ButtonSize.Large,
}

export const LargeDetrimentalButton = Template.bind({})
LargeDetrimentalButton.args = {
  ...DefaultButton.args,
  label: 'Detrimental Button',
  emphasis: ButtonEmphasis.Detrimental,
  size: ButtonSize.Large,
}

export const MediumIconButton = Template.bind({})
MediumIconButton.args = {
  size: ButtonSize.Medium,
  IconName: SendIcon,
}
