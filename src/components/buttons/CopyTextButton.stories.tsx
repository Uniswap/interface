import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { CopyTextButton } from 'src/components/buttons/CopyTextButton'

export default {
  title: 'WIP/Button/Copy',
  component: CopyTextButton,
} as ComponentMeta<typeof CopyTextButton>

const Template: ComponentStory<typeof CopyTextButton> = (args) => <CopyTextButton {...args} />

export const Primary = Template.bind({})
