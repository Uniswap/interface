import { Currency } from '@uniswap/sdk-core'
import React, { Suspense, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { SearchBar } from 'src/components/SearchBar'
import { FilterGroup } from 'src/components/TokenSelector/FilterGroup'
import { useFilterCallbacks } from 'src/components/TokenSelector/hooks'
import { TokenSearchResultList } from 'src/components/TokenSelector/SearchResults'

interface TokenSearchProps {
  onSelectCurrency: (currency: Currency) => void
  otherCurrency?: Currency | null
  selectedCurrency?: Currency | null
  showNonZeroBalancesOnly?: boolean
  onBack: () => void
}

export function TokenSelect({
  onSelectCurrency,
  otherCurrency,
  showNonZeroBalancesOnly,
  onBack,
}: TokenSearchProps) {
  const {
    onChainPress,
    onChangeText,
    onClearChainFilter,
    onClearSearchFilter,
    onToggleFavoritesFilter,
    searchFilter,
    chainFilter,
    favoritesFilter,
    selected,
  } = useFilterCallbacks(otherCurrency?.chainId ?? null)

  const { t } = useTranslation()

  const onClearFilters = useCallback(() => {
    onClearSearchFilter()
    onClearChainFilter()
  }, [onClearChainFilter, onClearSearchFilter])

  return (
    <Flex gap="lg" overflow="hidden" px="md" width="100%">
      <SearchBar
        placeholder={t('Search token symbols or address')}
        value={searchFilter}
        onBack={onBack}
        onChangeText={onChangeText}
      />
      <FilterGroup
        resetButtonLabel={showNonZeroBalancesOnly ? t('Your tokens') : t('All tokens')}
        selected={selected}
        onPressFavorites={onToggleFavoritesFilter}
        onPressNetwork={onChainPress}
        onReset={onClearChainFilter}
      />
      <Suspense fallback={<TokenSearchResultsLoading />}>
        <TokenSearchResultList
          chainFilter={chainFilter}
          favoritesFilter={favoritesFilter}
          searchFilter={searchFilter}
          showNonZeroBalancesOnly={showNonZeroBalancesOnly}
          onClearSearchFilter={onClearFilters}
          onSelectCurrency={onSelectCurrency}
        />
      </Suspense>
    </Flex>
  )
}

function TokenSearchResultsLoading() {
  return (
    <Flex fill>
      <Loading repeat={5} type="token" />
    </Flex>
  )
}
