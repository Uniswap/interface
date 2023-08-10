import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Box, Flex } from 'src/components/layout/index'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { Text } from 'src/components/Text'
import HeartIcon from 'ui/src/assets/icons/heart.svg'
import { theme } from 'ui/src/theme/restyle/theme'

const CenterElement = <Text variant="headlineLarge">Screen Title</Text>

const RightElement = (
  <HeartIcon
    color={theme.colors.neutral3}
    height={theme.iconSizes.icon24}
    width={theme.iconSizes.icon24}
  />
)

export default {
  title: 'WIP/Layout/HeaderScrollScreen',
  component: HeaderScrollScreen,
  decorators: [
    (Story): JSX.Element => (
      <Box borderColor="surface2" borderWidth={1} height={812} width={375}>
        <Story />
      </Box>
    ),
  ],
} as ComponentMeta<typeof HeaderScrollScreen>

const Template: ComponentStory<typeof HeaderScrollScreen> = (args) => {
  return (
    <HeaderScrollScreen {...args}>
      <Flex row bg="surface2" m="spacing16" p="spacing16">
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
