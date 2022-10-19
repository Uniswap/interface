import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { Text } from 'src/components/Text'
import { Box, Flex } from '../index'

const ContentHeader = (
  <Flex row alignItems="center" gap="xs" my="xs">
    <Text variant="headlineLarge">Screen Title</Text>
  </Flex>
)

const FixedHeader = (
  <Flex row alignItems="center" gap="xs" my="xs">
    <Text variant="headlineLarge">Fixed Screen Title</Text>
  </Flex>
)

export default {
  title: 'WIP/Layout/HeaderScrollScreen',
  component: HeaderScrollScreen,
  decorators: [
    (Story) => (
      <Box borderColor="backgroundContainer" borderWidth={1} height={812} width={375}>
        <Story />
      </Box>
    ),
  ],
} as ComponentMeta<typeof HeaderScrollScreen>

const Template: ComponentStory<typeof HeaderScrollScreen> = (args) => {
  return (
    <HeaderScrollScreen {...args}>
      <Flex row bg="backgroundContainer" m="md" p="md">
        <Text variant="bodyLarge">Body content</Text>
      </Flex>
    </HeaderScrollScreen>
  )
}

export const Primary = Template.bind({})
Primary.args = {
  contentHeader: ContentHeader,
  fixedHeader: FixedHeader,
}
