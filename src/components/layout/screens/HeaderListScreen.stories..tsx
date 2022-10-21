import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { ListRenderItemInfo } from 'react-native'
import { HeaderListScreen } from 'src/components/layout/screens/HeaderListScreen'
import { Separator } from 'src/components/layout/Separator'
import { Text } from 'src/components/Text'
import { Box, Flex } from '../index'

const data = Array.from(Array(10).keys())

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

const renderItem = ({ item }: ListRenderItemInfo<number>) => {
  return (
    <Flex row gap="sm" p="md">
      <Text variant="bodyLarge">Row {item}</Text>
    </Flex>
  )
}
export default {
  title: 'Layout/HeaderListScreen',
  component: HeaderListScreen,
  decorators: [
    (Story) => (
      <Box borderColor="background2" borderWidth={1} height={812} width={375}>
        <Story />
      </Box>
    ),
  ],
} as ComponentMeta<typeof HeaderListScreen>

const Template: ComponentStory<typeof HeaderListScreen> = (args) => <HeaderListScreen {...args} />

export const Primary = Template.bind({})
Primary.args = {
  ItemSeparatorComponent: () => <Separator />,
  ScrolledScreenHeader: ContentHeader,
  data: data,
  keyExtractor: (item) => item,
  renderItem: renderItem,
  InitialScreenHeader: FixedHeader,
}
