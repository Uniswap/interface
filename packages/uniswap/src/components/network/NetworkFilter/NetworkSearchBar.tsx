import { Flex, fonts } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
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
        fontSize={fonts.body2.fontSize}
        hideIcon={false}
        placeholder={searchNetworksLabel}
        py="$spacing8"
        px="$spacing12"
        backgroundColor="$surface2"
        borderWidth="$spacing1"
        value={value}
        lineHeight={fonts.body2.lineHeight}
        maxFontSizeMultiplier={fonts.body2.maxFontSizeMultiplier}
        onChangeText={onChangeText}
      />
    </Flex>
  )
}
