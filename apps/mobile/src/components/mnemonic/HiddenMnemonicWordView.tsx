import React from 'react'
import { Flex } from 'ui/src'

const ROW_COUNT = 6

export function HiddenMnemonicWordView(): JSX.Element {
  return (
    <Flex
      row
      alignItems="stretch"
      backgroundColor="$surface2"
      borderRadius="$rounded20"
      gap="$spacing36"
      mt="$spacing16"
      px="$spacing32"
      py="$spacing24"
    >
      <HiddenWordViewColumn />
      <HiddenWordViewColumn />
    </Flex>
  )
}

function HiddenWordViewColumn(): JSX.Element {
  return (
    <Flex grow gap="$spacing20">
      {new Array(ROW_COUNT).fill(0).map((_, idx) => (
        <Flex key={idx} backgroundColor="$surface3" borderRadius="$rounded20" height={10} />
      ))}
    </Flex>
  )
}
