import { Currency } from '@uniswap/sdk-core'
import Fuse from 'fuse.js'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo, StyleSheet } from 'react-native'
import { filter } from 'src/components/TokenSelector/filter'
import { useFavoriteCurrenciesWithMetadata } from 'src/components/TokenSelector/hooks'
import { TokenOption } from 'src/components/TokenSelector/TokenOption'
import { CurrencyWithMetadata } from 'src/components/TokenSelector/types'
import { ChainId } from 'src/constants/chains'
import { usePortfolioBalances } from 'src/features/dataApi/balances'
import { ElementName } from 'src/features/telemetry/constants'
import { useAllCurrencies } from 'src/features/tokens/useTokens'
import { useCombinedTokenWarningLevelMap } from 'src/features/tokens/useTokenWarningLevel'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { currencyId } from 'src/utils/currencyId'
import { flattenObjectOfObjects } from 'src/utils/objects'
import { useDebounce } from 'src/utils/timing'
import { TextButton } from '../buttons/TextButton'
import { Flex, Inset } from '../layout'
import { Text } from '../Text'

interface TokenSearchResultListProps {
  showNonZeroBalancesOnly?: boolean
  onClearSearchFilter: () => void
  onSelectCurrency: (currency: Currency) => void
  searchFilter: string | null
  favoritesFilter: boolean
  chainFilter: ChainId | null
}

export function TokenSearchResultList({
  showNonZeroBalancesOnly,
  onClearSearchFilter,
  onSelectCurrency,
  chainFilter,
  favoritesFilter,
  searchFilter,
}: TokenSearchResultListProps) {
  const { t } = useTranslation()
  const activeAccount = useActiveAccountWithThrow()
  const currenciesByChain = useAllCurrencies()
  const currencyIdToBalances = usePortfolioBalances(activeAccount.address, false)

  const currenciesWithBalances: CurrencyWithMetadata[] = useMemo(() => {
    if (!currencyIdToBalances) return []

    return Object.values(currencyIdToBalances).map(({ amount, balanceUSD }) => ({
      currency: amount.currency,
      currencyAmount: amount,
      balanceUSD: balanceUSD,
    }))
  }, [currencyIdToBalances])

  const allCurrencies: CurrencyWithMetadata[] = useMemo(() => {
    const currencies = flattenObjectOfObjects(currenciesByChain)
    return currencies.map((currency) => ({
      currency,
      currencyAmount: null,
      balanceUSD: null,
    }))
  }, [currenciesByChain])

  const currenciesWithMetadata = showNonZeroBalancesOnly ? currenciesWithBalances : allCurrencies

  const debouncedSearchFilter = useDebounce(searchFilter)
  const favoriteCurrencies = useFavoriteCurrenciesWithMetadata(currenciesWithMetadata)

  const filteredCurrencies = useMemo(
    () =>
      filter(
        favoritesFilter ? favoriteCurrencies : currenciesWithMetadata ?? null,
        chainFilter,
        debouncedSearchFilter
      ),
    [
      chainFilter,
      currenciesWithMetadata,
      favoriteCurrencies,
      favoritesFilter,
      debouncedSearchFilter,
    ]
  )

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

  return (
    <FlatList
      ListEmptyComponent={
        <Flex centered gap="sm" px="lg">
          <Text variant="mediumLabel">😔</Text>
          <Text color="textTertiary" textAlign="center" variant="mediumLabel">
            {searchFilter
              ? t('No tokens found for ”{{searchFilter}}”', { searchFilter })
              : t('No tokens found')}
          </Text>
          <TextButton
            name={ElementName.ClearSearch}
            textColor="accentActive"
            onPress={onClearSearchFilter}>
            {t('Clear search')}
          </TextButton>
        </Flex>
      }
      ListFooterComponent={Footer}
      data={filteredCurrencies}
      keyExtractor={key}
      renderItem={renderItem}
      style={styles.list}
      windowSize={1}
    />
  )
}

function Footer() {
  return (
    <Inset all="xxl">
      <Inset all="md" />
    </Inset>
  )
}

function key(item: Fuse.FuseResult<CurrencyWithMetadata>) {
  return currencyId(item.item.currency)
}

const styles = StyleSheet.create({
  list: {
    height: '100%',
    width: '100%',
  },
})
