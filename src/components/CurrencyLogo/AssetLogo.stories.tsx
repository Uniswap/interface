import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Box } from '../layout'
import { AssetLogoWithFallback } from './AssetLogo'

export default {
  title: 'WIP/Logos/AssetLogo',
  component: AssetLogoWithFallback,
  decorators: [
    (Story) => (
      <Box bg="background3" height={300} width={300}>
        <Story />
      </Box>
    ),
  ],
} as ComponentMeta<typeof AssetLogoWithFallback>

const Template: ComponentStory<typeof AssetLogoWithFallback> = (args) => (
  <AssetLogoWithFallback {...args} />
)

export const Primary = Template.bind({})
Primary.args = {
  url: 'https://token-icons.s3.amazonaws.com/eth.png',
  name: 'Maker',
}

export const Fallback = Template.bind({})
Fallback.args = {
  url: undefined,
  name: 'Maker',
}
