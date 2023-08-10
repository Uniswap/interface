import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { Box } from '.'

export default {
  title: 'WIP/Layout/BaseCard',
  component: BaseCard.Container,
  decorators: [
    (Story): JSX.Element => (
      <Box bg="surface2" width={300}>
        <Story />
      </Box>
    ),
  ],
} as ComponentMeta<typeof BaseCard.Container>

const Template: ComponentStory<typeof BaseCard.Container> = ({ children }) => (
  <BaseCard.Container>{children}</BaseCard.Container>
)

export const Primary = Template.bind({})
Primary.args = {
  children: (
    <Flex>
      <BaseCard.Header subtitle="$124.34" title="Tokens" onPress={(): undefined => undefined} />
      <Text variant="bodyLarge">My Content</Text>
    </Flex>
  ),
}

export const EmptyState = Template.bind({})
EmptyState.args = {
  children: (
    <BaseCard.EmptyState
      buttonLabel="Explore"
      description="Buy tokens on any Uniswap supported chains to start building your all-in-one portfolio and wallet."
      title="Explore NFTs"
      onPress={(): undefined => undefined}
    />
  ),
}
