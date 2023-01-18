import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import HeartIcon from 'src/assets/icons/heart.svg'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { Text } from 'src/components/Text'
import { theme } from 'src/styles/theme'
import { Box, Flex } from '../index'

const CenterElement = <Text variant="headlineLarge">Screen Title</Text>

const RightElement = (
  <HeartIcon
    fill={theme.colors.none}
    height={theme.iconSizes.lg}
    stroke={theme.colors.textSecondary}
    strokeWidth={2}
    width={theme.iconSizes.lg}
  />
)

export default {
  title: 'WIP/Layout/HeaderScrollScreen',
  component: HeaderScrollScreen,
  decorators: [
    (Story): JSX.Element => (
      <Box borderColor="background2" borderWidth={1} height={812} width={375}>
        <Story />
      </Box>
    ),
  ],
} as ComponentMeta<typeof HeaderScrollScreen>

const Template: ComponentStory<typeof HeaderScrollScreen> = (args) => {
  return (
    <HeaderScrollScreen {...args}>
      <Flex row bg="background2" m="md" p="md">
        <Text variant="bodyLarge">Body content</Text>
      </Flex>
    </HeaderScrollScreen>
  )
}

export const Primary = Template.bind({})
Primary.args = {
  centerElement: CenterElement,
  rightElement: RightElement,
}
