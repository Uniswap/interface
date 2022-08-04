import React from 'react'
import { SearchTextInput, SearchTextInputProps } from 'src/components/input/SearchTextInput'
import { Flex } from 'src/components/layout'

interface SearchBarProps extends SearchTextInputProps {}

export function SearchBar(props: SearchBarProps) {
  return (
    <Flex centered row gap="sm" mx="md">
      {/* TODO: add back button that doesn't depend on react-navigation */}
      <SearchTextInput {...props} />
    </Flex>
  )
}
