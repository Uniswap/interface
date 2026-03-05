import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useTokenSectionsForEmptySearch } from 'uniswap/src/components/TokenSelector/hooks/useTokenSectionsForEmptySearch'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { OnSelectCurrency } from 'uniswap/src/components/TokenSelector/types'
import type { AddressGroup } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

function _TokenSelectorEmptySearchList({
  addresses,
  chainFilter,
  onSelectCurrency,
  renderedInModal,
}: {
  addresses: AddressGroup
  onSelectCurrency: OnSelectCurrency
  chainFilter: UniverseChainId | null
  renderedInModal: boolean
}): JSX.Element {
  const { t } = useTranslation()

  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useTokenSectionsForEmptySearch({
    addresses,
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
      renderedInModal={renderedInModal}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorEmptySearchList = memo(_TokenSelectorEmptySearchList)
