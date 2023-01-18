import React from 'react'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'

const LEFT_COLUMN_INDEXES = [1, 2, 3, 4, 5, 6]
const RIGHT_COLUMN_INDEXES = [7, 8, 9, 10, 11, 12]
export function HiddenMnemonicWordView(): JSX.Element {
  return (
    <Flex
      row
      alignItems="stretch"
      bg="background0"
      height="50%"
      justifyContent="space-evenly"
      mt="md"
      px="lg">
      <Flex grow justifyContent="space-between">
        <HiddenWordViewColumn indexes={LEFT_COLUMN_INDEXES} />
      </Flex>
      <Flex grow justifyContent="space-between">
        <HiddenWordViewColumn indexes={RIGHT_COLUMN_INDEXES} />
      </Flex>
    </Flex>
  )
}

function HiddenWordViewColumn({ indexes }: { indexes: number[] }): JSX.Element {
  return (
    <>
      {indexes.map((value) => (
        <Flex key={value} row alignItems="center" justifyContent="space-between" px="sm" py="md">
          <Text color="textSecondary">{value}</Text>
          <Box bg="textTertiary" borderRadius="xl" flex={1} height={9} />
        </Flex>
      ))}
    </>
  )
}
