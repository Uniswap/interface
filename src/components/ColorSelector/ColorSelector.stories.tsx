import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Box } from '../layout'
import { ColorSelector } from './ColorSelector'

export default {
  title: 'Components/ColorSelector',
  component: ColorSelector,
  decorators: [
    (Story) => (
      <Box bg="deprecated_gray50" p="md" width={400}>
        <Story />
      </Box>
    ),
  ],
} as ComponentMeta<typeof ColorSelector>

const Template: ComponentStory<typeof ColorSelector> = () => (
  <ColorSelector updateColor={(_color: string) => {}} />
)

export const Primary = Template.bind({})
