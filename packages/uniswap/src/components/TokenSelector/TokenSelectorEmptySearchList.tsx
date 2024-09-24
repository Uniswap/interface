import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { useTokenSectionsForEmptySearch } from 'uniswap/src/components/TokenSelector/hooks'
import { OnSelectCurrency } from 'uniswap/src/components/TokenSelector/types'
import { UniverseChainId } from 'uniswap/src/types/chains'

function _TokenSelectorEmptySearchList({
  chainFilter,
  onSelectCurrency,
}: {
  onSelectCurrency: OnSelectCurrency
  chainFilter: UniverseChainId | null
  isKeyboardOpen?: boolean
}): JSX.Element {
  const { t } = useTranslation()

  const { data: sections, loading, error, refetch } = useTokenSectionsForEmptySearch(chainFilter)

  return (
    <TokenSelectorList
      showTokenAddress
      errorText={t('token.selector.search.error')}
      hasError={Boolean(error)}
      loading={loading}
      refetch={refetch}
      sections={sections}
      showTokenWarnings={true}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorEmptySearchList = memo(_TokenSelectorEmptySearchList)
