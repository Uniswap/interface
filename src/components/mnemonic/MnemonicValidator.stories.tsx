import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Box, Flex } from '../layout'
import { Text } from '../Text'
import { FOR_STORYBOOK } from './MnemonicValidator'

const MnemonicValidator = FOR_STORYBOOK.MnemonicValidator

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

const POSITIONS_TO_CONFIRM = [2, 4, 7, 9]

export default {
  title: 'Mnemonic/MnemonicValidator',
  component: MnemonicValidator,
  decorators: [
    (Story) => (
      <Flex row>
        <Box bg="gray50" p="md" width={300}>
          <Story />
        </Box>
        <Flex bg="gray50" gap="xs" p="md">
          <Text color="textColor" variant="bodyBold">
            Mnemonic
          </Text>
          {SAMPLE_SEED.map((s, i) => (
            <Text
              key={s}
              color={POSITIONS_TO_CONFIRM.includes(i) ? 'black' : 'gray400'}
              variant="body">
              {s}
            </Text>
          ))}
        </Flex>
      </Flex>
    ),
  ],
} as ComponentMeta<typeof MnemonicValidator>

const Template: ComponentStory<typeof MnemonicValidator> = () => (
  <MnemonicValidator missingPositions={[2, 4, 7, 9]} mnemonic={SAMPLE_SEED} onSuccess={() => {}} />
)

export const Primary = Template.bind({})
