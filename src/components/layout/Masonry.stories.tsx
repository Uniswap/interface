/* eslint-disable react-native/no-inline-styles */
import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { View } from 'react-native'
import { Text } from 'src/components/Text'
import { Box } from '../layout'
import { Masonry } from './Masonry'

const data = [
  { key: 1, color: 'pink', height: 50 },
  { key: 2, color: 'lightpink', height: 75 },
  { key: 3, color: 'hotpink', height: 150 },
  { key: 4, color: 'deeppink', height: 80 },
  { key: 5, color: 'mediumvioletred', height: 50 },
  { key: 6, color: 'palevioletred', height: 75 },
  { key: 7, color: 'crimson', height: 25 },
  { key: 8, color: 'red', height: 40 },
  { key: 9, color: 'lightsalmon', height: 50 },
  { key: 10, color: 'darksalmon', height: 75 },
  { key: 11, color: 'lightcoral', height: 23 },
]

export default {
  title: 'WIP/Layout/Masonry',
  component: Masonry,
  decorators: [
    (Story) => (
      <Box bg="background3" width={300}>
        <Story />
      </Box>
    ),
  ],
} as ComponentMeta<typeof Masonry>

const Template: ComponentStory<typeof Masonry> = () => (
  <Masonry
    data={data}
    getKey={({ key }) => key.toString()}
    loading={false}
    renderItem={({ key, color, height }) => (
      <View
        style={{
          backgroundColor: color,
          height: height,
          width: '100%',
          padding: 5,
        }}>
        <Text color="accentActionSoft" variant="monospace">
          {key}
        </Text>
      </View>
    )}
  />
)

export const Primary = Template.bind({})
