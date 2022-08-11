import { Currency } from '@uniswap/sdk-core'
import Fuse from 'fuse.js'
import React, { Suspense, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { FilterGroup } from 'src/components/TokenSelector/FilterGroup'
import { CurrencyWithMetadata } from 'src/components/TokenSelector/types'
import { TokenOption } from 'src/components/TokenSelector/TokenOption'
import { Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { SearchBar } from 'src/components/SearchBar'
import { usePortfolioBalances } from 'src/features/dataApi/balances'
import { useAllCurrencies } from 'src/features/tokens/useTokens'
import { useCombinedTokenWarningLevelMap } from 'src/features/tokens/useTokenWarningLevel'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { flattenObjectOfObjects } from 'src/utils/objects'
import { useFilteredCurrencies } from './hooks'
import { TokenSearchResultList } from './SearchResults'

interface TokenSearchProps {
  onSelectCurrency: (currency: Currency) => void
  otherCurrency?: Currency | null
  selectedCurrency?: Currency | null
  showNonZeroBalancesOnly?: boolean
}

export function TokenSelect(props: TokenSearchProps) {
  return (
    // TODO: add a more sophisticated loading component here
    <Suspense fallback={<Loading />}>
      <TokenSelectContent {...props} />
    </Suspense>
  )
}

export function TokenSelectContent({
  onSelectCurrency,
  otherCurrency,
  showNonZeroBalancesOnly,
}: TokenSearchProps) {
  const activeAccount = useActiveAccountWithThrow()
  const currenciesByChain = useAllCurrencies()
  const currencyIdToBalances = usePortfolioBalances(activeAccount.address, false)
  const currenciesWithBalances = useMemo(() => {
    if (!currencyIdToBalances) return []

    return Object.values(currencyIdToBalances).map(({ amount, balanceUSD }) => ({
      currency: amount.currency,
      currencyAmount: amount,
      balanceUSD: balanceUSD,
    }))
  }, [currencyIdToBalances])

  const allCurrencies = useMemo(() => {
    const currencies = flattenObjectOfObjects(currenciesByChain)
    return currencies.map((currency) => ({
      currency,
      currencyAmount: null,
      balanceUSD: null,
    }))
  }, [currenciesByChain])

  const {
    filteredCurrencies,
    onChainPress,
    onChangeText,
    onClearChainFilter,
    onClearSearchFilter,
    onToggleFavoritesFilter,
    searchFilter,
    selected,
  } = useFilteredCurrencies(
    showNonZeroBalancesOnly ? currenciesWithBalances : allCurrencies,
    otherCurrency?.chainId ?? null
  )

  const { t } = useTranslation()

  const tokenWarningLevelMap = useCombinedTokenWarningLevelMap()

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Fuse.FuseResult<CurrencyWithMetadata>>) => {
      const currencyWithMetadata = item.item
      return (
        <TokenOption
          currencyWithMetadata={currencyWithMetadata}
          matches={item.matches}
          tokenWarningLevelMap={tokenWarningLevelMap}
          onPress={() => onSelectCurrency?.(currencyWithMetadata.currency)}
        />
      )
    },
    [onSelectCurrency, tokenWarningLevelMap]
  )

  const onClearFilters = useCallback(() => {
    onClearSearchFilter()
    onClearChainFilter()
  }, [onClearChainFilter, onClearSearchFilter])

  return (
    <Flex gap="lg" overflow="hidden" px="md" width="100%">
      <SearchBar
        placeholder={t('Search token symbols or address')}
        value={searchFilter}
        onChangeText={onChangeText}
      />

      <FilterGroup
        resetButtonLabel={showNonZeroBalancesOnly ? t('Your tokens') : t('All tokens')}
        selected={selected}
        onPressFavorites={onToggleFavoritesFilter}
        onPressNetwork={onChainPress}
        onReset={onClearChainFilter}
      />

      <TokenSearchResultList
        currenciesWithMetadata={filteredCurrencies}
        renderItem={renderItem}
        searchFilter={searchFilter}
        onClearSearchFilter={onClearFilters}
      />
    </Flex>
  )
}
