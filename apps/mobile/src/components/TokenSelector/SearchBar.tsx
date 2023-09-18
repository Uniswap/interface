import React from 'react'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { SearchTextInput, SearchTextInputProps } from 'src/components/input/SearchTextInput'
import { ElementName } from 'src/features/telemetry/constants'
import { Flex, Icons } from 'ui/src'
import { iconSizes } from 'ui/src/theme'

interface SearchBarProps extends SearchTextInputProps {
  onBack?: () => void
}

// Use instead of SearchTextInput when you need back button functionality outside of nav stack (i.e., inside BottomSheetModals)
export function SearchBar({ onBack, ...rest }: SearchBarProps): JSX.Element {
  return (
    <Flex centered row gap="$spacing12">
      {onBack && (
        <TouchableArea testID={ElementName.Back} onPress={onBack}>
          <Icons.Chevron color="$neutral1" size={iconSizes.icon24} />
        </TouchableArea>
      )}
      <SearchTextInput {...rest} />
    </Flex>
  )
}
