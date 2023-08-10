import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Box } from 'src/components/layout'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { ExampleComponent } from './_ExampleComponent'

export default {
  // 👇 The title prop is optional.
  // See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
  // to learn how to generate automatic titles
  title: 'Introduction/Example Story',
  component: ExampleComponent,
  // Decorators allow you to mock up context around the story component (e.g. a margin)
  decorators: [
    (Story): JSX.Element => (
      <Box m="spacing24">
        <Story />
      </Box>
    ),
  ],
} as ComponentMeta<typeof ExampleComponent>

//👇 We create a “template” of how args map to rendering (e.g. the outermost element might receive some props, like a `title`, and others might show up in different places, such as `children`)
const Template: ComponentStory<typeof ExampleComponent> = ({ header, children, success }) => (
  <ExampleComponent header={header} success={success}>
    {children}
  </ExampleComponent>
)

export const ExampleGreen = Template.bind({})
ExampleGreen.args = {
  success: true,
  header: (
    <Text color="neutral1" variant="headlineLarge">
      The `success: true` argument passed to this version of the component will make its background
      green!
    </Text>
  ),
  children: (
    <Flex>
      <Text color="neutral2" variant="subheadLarge">
        One paragraph
      </Text>
      <Text color="neutral2" variant="bodyLarge">
        Another paragraph
      </Text>
    </Flex>
  ),
}

export const ExampleRed = Template.bind({})
ExampleRed.args = {
  success: false,
  header: (
    <Text color="neutral2" variant="headlineSmall">
      But when `success: false` is passed in, its background will be red
    </Text>
  ),
  children: (
    <Flex>
      <Text color="statusCritical" variant="bodyLarge">
        Scary red text!
      </Text>
    </Flex>
  ),
}

export const ExampleRedWithParagraph = Template.bind({})
ExampleRedWithParagraph.args = {
  ...ExampleRed.args,
  children: (
    <>
      <Text color="statusCritical" variant="headlineLarge">
        Scary red text!
      </Text>
      <Text color="statusCritical" variant="bodyLarge">
        With a scary warning text body paragraph underneath it no less!
      </Text>
    </>
  ),
}
