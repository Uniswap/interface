import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Autocomplete } from 'src/components/autocomplete/Autocomplete'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'

const DEFAULT_OPTIONS = [
  { data: 'ETH', key: 'eth' },
  { data: 'DAI', key: 'dai' },
  { data: 'MKR', key: 'mkr' },
  { data: 'BTC', key: 'btc' },
]

export default {
  title: 'WIP/Components/Autocomplete',
  component: Autocomplete,
  decorators: [
    (Story) => (
      <Box bg="backgroundBackdrop" borderRadius="md" p="lg" width={400}>
        <Story />
      </Box>
    ),
  ],
  args: {
    filterOptions: (pattern: string, options: typeof DEFAULT_OPTIONS) =>
      pattern
        ? options.filter((o) => o.data.toLowerCase().includes(pattern.toLowerCase()))
        : options,
    options: DEFAULT_OPTIONS,
    placeholder: 'Search tokens',
    renderOption: (option: typeof DEFAULT_OPTIONS[0]) => (
      <Flex row alignItems="center" gap="sm">
        <Box bg="accentAction" borderRadius="full" p="md" />
        <Text color="textPrimary">{option.data}</Text>
      </Flex>
    ),
    EmptyComponent: (
      <Flex centered gap="sm" mt="lg" px="lg">
        <Text color="textSecondary" variant="buttonLabelMedium">
          😔
        </Text>
        <Text color="textSecondary" variant="buttonLabelMedium">
          No results found
        </Text>
      </Flex>
    ),
  },
} as ComponentMeta<typeof Autocomplete>

export const Primary: ComponentStory<typeof Autocomplete> = (args) => <Autocomplete {...args} />

export const Custom: ComponentStory<typeof Autocomplete> = (args) => (
  <Autocomplete
    {...args}
    InitialComponent={
      <Flex>
        <Text color="textSecondary" fontSize={16}>
          Suggestions
        </Text>
        <Flex>
          <Flex row alignItems="center" gap="sm">
            <Box bg="accentAction" borderRadius="full" p="md" />
            <Text color="textPrimary">ETH</Text>
          </Flex>
          <Flex row alignItems="center" gap="sm">
            <Box bg="accentAction" borderRadius="full" p="md" />
            <Text color="textPrimary">DAI</Text>
          </Flex>
          <Flex row alignItems="center" gap="sm">
            <Box bg="accentAction" borderRadius="full" p="md" />
            <Text color="textPrimary">MKR</Text>
          </Flex>
        </Flex>
      </Flex>
    }
  />
)
