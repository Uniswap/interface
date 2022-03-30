import React from 'react'
import { BackButton } from 'src/components/buttons/BackButton'
import { SearchTextInput, SearchTextInputProps } from 'src/components/input/SearchTextInput'
import { Flex } from 'src/components/layout'

interface SearchBarProps extends SearchTextInputProps {}

export function SearchBar(props: SearchBarProps) {
  return (
    <Flex centered row gap="sm">
      <BackButton />
      <SearchTextInput {...props} />
    </Flex>
  )
}
