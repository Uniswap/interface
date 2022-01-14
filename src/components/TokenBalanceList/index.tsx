import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React from 'react'
import { ActivityIndicator, FlatList, ListRenderItemInfo, RefreshControl } from 'react-native'
import { Box } from 'src/components/layout/Box'
import { TokenBalanceItem } from 'src/components/TokenBalanceList/TokenBalanceItem'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { ChainId } from 'src/constants/chains'
import { useTokenPrices } from 'src/features/historicalChainData/useTokenPrices'
import { currencyId } from 'src/utils/currencyId'

interface TokenBalanceListProps {
  loading: boolean
  balances: CurrencyAmount<Currency>[]
  refreshing: boolean
  onRefresh: () => void
  onPressToken: (currencyAmount: CurrencyAmount<Currency>) => void
}

export function TokenBalanceList({
  loading,
  balances,
  refreshing,
  onRefresh,
  onPressToken,
}: TokenBalanceListProps) {
  const currenciesToFetch = balances.map((currencyAmount) => currencyAmount.currency)
  const tokenPricesByChain = useTokenPrices(currenciesToFetch)

  if (loading) {
    return (
      <Box mt="lg" padding="lg">
        <ActivityIndicator animating={loading} color="grey" />
      </Box>
    )
  }

  const renderItem = ({ item }: ListRenderItemInfo<CurrencyAmount<Currency>>) => (
    <TokenBalanceItem
      currencyAmount={item}
      currencyPrice={
        tokenPricesByChain.chainIdToPrices[item.currency.chainId as ChainId]?.addressToPrice?.[
          currencyId(item.currency)
        ]?.priceUSD
      }
      onPressToken={onPressToken}
    />
  )
  const key = (balance: CurrencyAmount<Currency>) =>
    balance.currency.isNative
      ? `${balance.currency.chainId}${NULL_ADDRESS}`
      : `${balance.currency.chainId}${balance.currency.address}`

  return (
    <FlatList
      data={balances}
      keyExtractor={key}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={renderItem}
    />
  )
}
