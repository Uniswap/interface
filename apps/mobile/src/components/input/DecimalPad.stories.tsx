import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Box } from '../layout'
import { DecimalPad } from './DecimalPad'

export default {
  title: 'WIP/Inputs/DecimalPad',
  component: DecimalPad,
  decorators: [
    (Story): JSX.Element => (
      <Box bg="background3" height={300} width={300}>
        <Story />
      </Box>
    ),
  ],
} as ComponentMeta<typeof DecimalPad>

const Template: ComponentStory<typeof DecimalPad> = (args) => <DecimalPad {...args} />

export const Primary = Template.bind({})
