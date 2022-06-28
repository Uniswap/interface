import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { ListDetailScreen } from 'src/components/layout/ListDetailScreen'
import { ScrollDetailScreen } from 'src/components/layout/ScrollDetailScreen'
import { Text } from 'src/components/Text'
import { Box, Flex } from '../layout'

const data = Array.from(Array(10).keys())

const ContentHeader = (
  <Flex row alignItems="center" gap="xs" my="xs">
    <Text variant="headlineLarge">Screen Title</Text>
  </Flex>
)

export default {
  title: 'Layout/ScrollDetailScreen',
  component: ScrollDetailScreen,
  decorators: [
    (Story) => (
      <Box borderColor="backgroundContainer" borderWidth={1} height={812} width={375}>
        <Story />
      </Box>
    ),
  ],
} as ComponentMeta<typeof ListDetailScreen>

const Template: ComponentStory<typeof ListDetailScreen> = (args) => {
  return (
    <ScrollDetailScreen {...args}>
      <Flex row bg="backgroundContainer" m="md" p="md">
        <Text variant="body">Body content</Text>
      </Flex>
    </ScrollDetailScreen>
  )
}

export const Primary = Template.bind({})
Primary.args = {
  contentHeader: ContentHeader,
  data: data,
  title: 'Screen Title',
}
