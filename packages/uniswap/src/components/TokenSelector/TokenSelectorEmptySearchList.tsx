import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { useTokenSectionsForEmptySearch } from 'uniswap/src/components/TokenSelector/hooks'
import { ConvertFiatAmountFormattedCallback, OnSelectCurrency } from 'uniswap/src/components/TokenSelector/types'
// eslint-disable-next-line no-restricted-imports
import { FormatNumberOrStringInput } from 'uniswap/src/features/language/formatter'
import { UniverseChainId } from 'uniswap/src/types/chains'

function _TokenSelectorEmptySearchList({
  onDismiss,
  chainFilter,
  onSelectCurrency,
  formatNumberOrStringCallback,
  convertFiatAmountFormattedCallback,
}: {
  onSelectCurrency: OnSelectCurrency
  chainFilter: UniverseChainId | null
  isKeyboardOpen?: boolean
  formatNumberOrStringCallback: (input: FormatNumberOrStringInput) => string
  convertFiatAmountFormattedCallback: ConvertFiatAmountFormattedCallback
  onDismiss: () => void
}): JSX.Element {
  const { t } = useTranslation()

  const { data: sections, loading, error, refetch } = useTokenSectionsForEmptySearch(chainFilter)

  return (
    <TokenSelectorList
      showTokenAddress
      convertFiatAmountFormattedCallback={convertFiatAmountFormattedCallback}
      errorText={t('token.selector.search.error')}
      formatNumberOrStringCallback={formatNumberOrStringCallback}
      hasError={Boolean(error)}
      loading={loading}
      refetch={refetch}
      sections={sections}
      showTokenWarnings={true}
      onDismiss={onDismiss}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorEmptySearchList = memo(_TokenSelectorEmptySearchList)
