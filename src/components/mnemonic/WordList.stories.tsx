import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Box } from '../layout'
import { WordList } from './WordList'

const SAMPLE_SEED = [
  'dove',
  'lumber',
  'quote',
  'board',
  'young',
  'robust',
  'kit',
  'invite',
  'plastic',
  'regular',
  'skull',
  'history',
]

export default {
  title: 'Mnemonic/WordList',
  component: WordList,
  decorators: [
    (Story) => (
      <Box bg="deprecated_gray50" p="md" width={300}>
        <Story />
      </Box>
    ),
  ],
} as ComponentMeta<typeof WordList>

const Template: ComponentStory<typeof WordList> = () => (
  <WordList
    mnemonic={SAMPLE_SEED}
    unavailable={new Set([SAMPLE_SEED[1], SAMPLE_SEED[5]])}
    onPressWord={() => {}}
  />
)

export const Primary = Template.bind({})
