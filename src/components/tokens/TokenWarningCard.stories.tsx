import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import TokenWarningCard from 'src/components/tokens/TokenWarningCard'
import { TokenWarningLevel } from 'src/features/tokens/useTokenWarningLevel'
import { Box } from '../layout'

export default {
  title: 'WIP/Tokens/TokenWarningCard',
  component: TokenWarningCard,
  args: {
    tokenWarningLevel: TokenWarningLevel.LOW,
  },
  decorators: [
    (Story) => (
      <Box bg="background3" height={300} width={400}>
        <Story />
      </Box>
    ),
  ],
} as ComponentMeta<typeof TokenWarningCard>

const Template: ComponentStory<typeof TokenWarningCard> = (args) => <TokenWarningCard {...args} />

export const Primary = Template.bind({})

export const Secondary = Template.bind({})
Secondary.args = {
  tokenWarningLevel: TokenWarningLevel.MEDIUM,
}

export const Blocked = Template.bind({})
Blocked.args = {
  tokenWarningLevel: TokenWarningLevel.BLOCKED,
}
