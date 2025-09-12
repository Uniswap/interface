import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useTokenSectionsForEmptySearch } from 'uniswap/src/components/TokenSelector/hooks/useTokenSectionsForEmptySearch'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { OnSelectCurrency } from 'uniswap/src/components/TokenSelector/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

function _TokenSelectorEmptySearchList({
  evmAddress,
  svmAddress,
  chainFilter,
  onSelectCurrency,
}: {
  evmAddress?: string
  svmAddress?: string
  onSelectCurrency: OnSelectCurrency
  chainFilter: UniverseChainId | null
}): JSX.Element {
  const { t } = useTranslation()

  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useTokenSectionsForEmptySearch({
    evmAddress,
    svmAddress,
    chainFilter,
  })

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
