import { forwardRef } from 'react'
import { TextInput } from 'react-native'
import { Flex, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { SearchTextInput, SearchTextInputProps } from 'uniswap/src/features/search/SearchTextInput'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

interface SearchBarProps extends SearchTextInputProps {
  onBack?: () => void
  hideBackButton?: boolean
}

// Use instead of SearchTextInput when you need back button functionality outside of nav stack (i.e., inside Modals)
export const SearchBar = forwardRef<TextInput, SearchBarProps>(function _SearchBar(
  { onBack, hideBackButton, ...rest },
  ref,
): JSX.Element {
  return (
    <Flex centered row gap="$spacing12">
      {onBack && !hideBackButton && (
        <TouchableArea testID={TestID.Back} onPress={onBack}>
          <RotatableChevron color="$neutral2" height={iconSizes.icon24} width={iconSizes.icon24} />
        </TouchableArea>
      )}
      <SearchTextInput ref={ref} {...rest} />
    </Flex>
  )
})
