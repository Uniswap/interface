import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React, { useCallback } from 'react'
import { ActivityIndicator, FlatList, ListRenderItemInfo, RefreshControl } from 'react-native'
import { Box } from 'src/components/layout/Box'
import { TokenBalanceItem } from 'src/components/TokenBalanceList/TokenBalanceItem'
import { ChainId } from 'src/constants/chains'
import { useTokenPrices } from 'src/features/historicalChainData/useTokenPrices'
import { SectionName } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'
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

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<CurrencyAmount<Currency>>) => (
      <TokenBalanceItem
        currencyAmount={item}
        currencyPrice={
          tokenPricesByChain.chainIdToPrices[item.currency.chainId as ChainId]?.addressToPrice?.[
            currencyId(item.currency)
          ]?.priceUSD
        }
        onPressToken={onPressToken}
      />
    ),
    [onPressToken, tokenPricesByChain.chainIdToPrices]
  )

  if (loading) {
    return (
      <Box mt="lg" padding="lg">
        <ActivityIndicator animating={loading} color="grey" />
      </Box>
    )
  }

  return (
    <Trace logImpression section={SectionName.TokenBalance}>
      <FlatList
        data={balances}
        keyExtractor={key}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={renderItem}
      />
    </Trace>
  )
}

function key(balance: CurrencyAmount<Currency>) {
  return currencyId(balance.currency)
}
