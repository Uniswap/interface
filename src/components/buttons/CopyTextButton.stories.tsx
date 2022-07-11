import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { PrimaryCopyTextButton } from 'src/components/buttons/CopyTextButton'

export default {
  title: 'WIP/Button/Copy',
  component: PrimaryCopyTextButton,
} as ComponentMeta<typeof PrimaryCopyTextButton>

const Template: ComponentStory<typeof PrimaryCopyTextButton> = (args) => (
  <PrimaryCopyTextButton {...args} />
)

export const Primary = Template.bind({})
