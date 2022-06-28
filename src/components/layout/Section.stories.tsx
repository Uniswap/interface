import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Flex } from 'src/components/layout/Flex'
import { Section } from 'src/components/layout/Section'
import { Text } from 'src/components/Text'
import { Box } from '../layout'

export default {
  title: 'Layout/Section',
  component: Section.Container,
  decorators: [
    (Story) => (
      <Box bg="deprecated_gray50" width={300}>
        <Story />
      </Box>
    ),
  ],
} as ComponentMeta<typeof Section.Container>

const Template: ComponentStory<typeof Section.Container> = ({ children }) => (
  <Section.Container>{children}</Section.Container>
)

export const Primary = Template.bind({})
Primary.args = {
  ...Primary.args,
  children: (
    <Flex>
      <Section.Header subtitle="$124.34" title="Tokens" onPress={() => {}} />
      <Text variant="body">My Content</Text>
    </Flex>
  ),
}

export const EmptyState = Template.bind({})
EmptyState.args = {
  ...EmptyState.args,
  children: (
    <Section.EmptyState
      buttonLabel="Explore"
      description="Buy tokens on any Uniswap supported chains to start building your all-in-one portfolio and wallet."
      title="Explore NFTs"
      onPress={() => {}}
    />
  ),
}
