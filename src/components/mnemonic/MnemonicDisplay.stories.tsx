import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Box } from '../layout'
import { MnemonicDisplay } from './MnemonicDisplay'

const DISPLAY_MNEMONIC = [
  'dove',
  'lumber',
  undefined,
  'board',
  'young',
  undefined,
  'kit',
  'invite',
  'plastic',
  'regular',
  'skull',
  'history',
]

export default {
  title: 'Mnemonic/MnemonicDisplay',
  component: MnemonicDisplay,
  decorators: [
    (Story) => (
      <Box bg="gray50" p="md" width={300}>
        <Story />
      </Box>
    ),
  ],
} as ComponentMeta<typeof MnemonicDisplay>

const Template: ComponentStory<typeof MnemonicDisplay> = () => (
  <MnemonicDisplay mnemonic={DISPLAY_MNEMONIC} />
)

export const Primary = Template.bind({})
