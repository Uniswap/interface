import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { ListRenderItemInfo } from 'react-native'
import { ListDetailScreen } from 'src/components/layout/ListDetailScreen'
import { Separator } from 'src/components/layout/Separator'
import { Text } from 'src/components/Text'
import { Box, Flex } from '../layout'

const data = Array.from(Array(10).keys())

const ContentHeader = (
  <Flex row alignItems="center" gap="xs" my="xs">
    <Text variant="h1">Screen Title</Text>
  </Flex>
)
const renderItem = ({ item }: ListRenderItemInfo<number>) => {
  return (
    <Flex row gap="sm" p="md">
      <Text variant="body1">Row {item}</Text>
    </Flex>
  )
}
export default {
  title: 'Layout/ListDetailScreen',
  component: ListDetailScreen,
  decorators: [
    (Story) => (
      <Box height={750} width={375}>
        <Story />
      </Box>
    ),
  ],
} as ComponentMeta<typeof ListDetailScreen>

const Template: ComponentStory<typeof ListDetailScreen> = (args) => <ListDetailScreen {...args} />

export const Primary = Template.bind({})
Primary.args = {
  ItemSeparatorComponent: () => <Separator />,
  contentHeader: ContentHeader,
  data: data,
  keyExtractor: (item) => item,
  renderItem: renderItem,
  title: 'Screen Title',
}
