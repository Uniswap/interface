import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { SearchTextInput, SearchTextInputProps } from 'src/components/input/SearchTextInput'
import { Flex } from 'src/components/layout'
import { ElementName } from 'src/features/telemetry/constants'

interface SearchBarProps extends SearchTextInputProps {
  onBack: () => void
  hideBackButton?: boolean
}

// Use instead of SearchTextInput when you need back button functionality outside of nav stack (i.e., inside BottomSheetModals)
export function SearchBar({ onBack, hideBackButton, ...rest }: SearchBarProps) {
  const theme = useAppTheme()
  return (
    <Flex centered row gap="sm" mx="md">
      {!hideBackButton && (
        <Button name={ElementName.Back} testID={ElementName.Back} onPress={onBack}>
          <Chevron color={theme.colors.textPrimary} />
        </Button>
      )}
      <SearchTextInput {...rest} />
    </Flex>
  )
}
