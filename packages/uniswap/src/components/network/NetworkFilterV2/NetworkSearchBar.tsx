import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { SearchTextInput } from 'uniswap/src/features/search/SearchTextInput'

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
    <Flex px="$spacing4" pb="$spacing8">
      <SearchTextInput
        accessibilityLabel={searchNetworksLabel}
        autoFocus={autoFocus}
        hideIcon={false}
        placeholder={searchNetworksLabel}
        py="$spacing8"
        px="$spacing12"
        backgroundColor="$surface2"
        borderWidth="$spacing1"
        value={value}
        onChangeText={onChangeText}
      />
    </Flex>
  )
}
