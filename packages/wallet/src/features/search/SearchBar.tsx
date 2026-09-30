import { Flex, TouchableArea } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { forwardRef } from 'react'
import { TextInput } from 'react-native'
// RotatableChevron is still web-only on mycelium (WEB_ONLY_MYCELIUM_ICONS); packages/wallet
// is native-reachable, so it stays on ui/src until it gets a native leg.
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { SearchTextInput, SearchTextInputProps } from 'uniswap/src/features/search/SearchTextInput'

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
          <RotatableChevron color="$neutral2" size="$icon.24" />
        </TouchableArea>
      )}
      <SearchTextInput ref={ref} {...rest} />
    </Flex>
  )
})
