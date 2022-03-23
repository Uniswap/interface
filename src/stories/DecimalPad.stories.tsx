import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { Box } from 'src/components/layout'

export default {
  title: 'Inputs/DecimalPad',
  component: DecimalPad,
  decorators: [
    (Story) => (
      <Box bg="gray50" height={300} width={300}>
        <Story />
      </Box>
    ),
  ],
} as ComponentMeta<typeof DecimalPad>

const Template: ComponentStory<typeof DecimalPad> = (args) => <DecimalPad {...args} />

export const Primary = Template.bind({})
