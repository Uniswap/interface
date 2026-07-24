import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { fonts } from 'ui/src/theme'
import { SearchTextInput } from 'uniswap/src/features/search/SearchTextInput'

// Matches the ~44px row height of the network list below (NetworkOption: py 10 + icon 24) so the
// search bar doesn't read as oversized relative to its siblings once minHeight is no longer left
// at SearchTextInput's 48px default.
const SEARCH_BAR_MIN_HEIGHT = 40

export function NetworkSearchBar({
  value,
  onChangeText,
  autoFocus,
}: {
  value: string
  onChangeText: (query: string) => void
  autoFocus?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const searchNetworksLabel = t('common.input.search.networks')

  return (
    // pt matches px below so the gap above the search input isn't left smaller than the gap to its
    // sides (it was previously supplied only incidentally by an ancestor's padding).
    <Flex px="$spacing4" pt="$spacing4" pb="$spacing8">
      <SearchTextInput
        accessibilityLabel={searchNetworksLabel}
        autoFocus={autoFocus}
        hideIcon={false}
        placeholder={searchNetworksLabel}
        py="$spacing8"
        px="$spacing12"
        minHeight={SEARCH_BAR_MIN_HEIGHT}
        // Match the body2 text used by the network rows below instead of SearchTextInput's
        // default body1, so the input doesn't look oversized next to them.
        fontSize={fonts.body2.fontSize}
        backgroundColor="$surface2"
        borderWidth="$spacing1"
        value={value}
        onChangeText={onChangeText}
      />
    </Flex>
  )
}
