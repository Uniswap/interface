import { Currency } from '@uniswap/sdk-core'
import Fuse from 'fuse.js'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { FilterGroup } from 'src/components/CurrencySelector/FilterGroup'
import { WarningOption } from 'src/components/CurrencySelector/WarningOption'
import { Flex } from 'src/components/layout'
import { SearchBar } from 'src/components/SearchBar'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useAllBalancesByChainId } from 'src/features/dataApi/balances'
import { useAllCurrencies } from 'src/features/tokens/useTokens'
import { useCombinedTokenWarningLevelMap } from 'src/features/tokens/useTokenWarningLevel'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { flattenObjectOfObjects } from 'src/utils/objects'
import { useFilteredCurrencies } from './hooks'
import { CurrencySearchResultList } from './SearchResults'

interface CurrencySearchProps {
  onSelectCurrency: (currency: Currency) => void
  otherCurrency?: Currency | null
  selectedCurrency?: Currency | null
  showNonZeroBalancesOnly?: boolean
}

export function CurrencySelect({
  onSelectCurrency,
  otherCurrency,
  showNonZeroBalancesOnly,
}: CurrencySearchProps) {
  const chainIds = useActiveChainIds()
  const activeAccount = useActiveAccount()
  const currenciesByChain = useAllCurrencies()
  const balances = useAllBalancesByChainId(activeAccount?.address, chainIds)
  const currenciesWithBalances = useMemo(
    () => flattenObjectOfObjects(balances.balances).map((b) => b.amount.currency),
    [balances.balances]
  )
  const allCurrencies = useMemo(
    () => flattenObjectOfObjects(currenciesByChain),
    [currenciesByChain]
  )

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
    ({ item }: ListRenderItemInfo<Fuse.FuseResult<Currency>>) => {
      const currency = item.item
      return (
        <WarningOption
          currency={currency}
          matches={item.matches}
          tokenWarningLevelMap={tokenWarningLevelMap}
          onPress={() => onSelectCurrency?.(currency)}
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

      <CurrencySearchResultList
        currencies={filteredCurrencies}
        renderItem={renderItem}
        searchFilter={searchFilter}
        onClearSearchFilter={onClearFilters}
      />
    </Flex>
  )
}
