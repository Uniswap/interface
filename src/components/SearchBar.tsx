import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { SearchTextInput, SearchTextInputProps } from 'src/components/input/SearchTextInput'
import { Flex } from 'src/components/layout'

interface SearchBarProps extends SearchTextInputProps {
  onBack: () => void
}

export function SearchBar({ onBack, ...rest }: SearchBarProps) {
  const theme = useAppTheme()
  return (
    <Flex centered row gap="sm" mx="md">
      <Button onPress={onBack}>
        <Flex row alignItems="center" gap="xs">
          <Chevron color={theme.colors.textSecondary} />
        </Flex>
      </Button>
      <SearchTextInput {...rest} />
    </Flex>
  )
}
