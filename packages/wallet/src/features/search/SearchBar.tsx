import { Flex, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { SearchTextInput, SearchTextInputProps } from 'wallet/src/features/search/SearchTextInput'
import { ElementName } from 'wallet/src/telemetry/constants'

interface SearchBarProps extends SearchTextInputProps {
  onBack?: () => void
}

// Use instead of SearchTextInput when you need back button functionality outside of nav stack (i.e., inside BottomSheetModals)
export function SearchBar({ onBack, ...rest }: SearchBarProps): JSX.Element {
  return (
    <Flex centered row gap="$spacing12">
      {onBack && (
        <TouchableArea testID={ElementName.Back} onPress={onBack}>
          <RotatableChevron color="$neutral2" height={iconSizes.icon24} width={iconSizes.icon24} />
        </TouchableArea>
      )}
      <SearchTextInput {...rest} />
    </Flex>
  )
}
