import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React, { useCallback, useMemo } from 'react'
import { ActivityIndicator, ListRenderItemInfo, SectionList } from 'react-native'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { TokenBalanceItem } from 'src/components/TokenBalanceList/TokenBalanceItem'
import { ALL_SUPPORTED_CHAIN_IDS, ChainId, CHAIN_INFO } from 'src/constants/chains'
import { ChainIdToAddressToCurrencyAmount } from 'src/features/balances/hooks'
import { useTokenPrices } from 'src/features/historicalChainData/useTokenPrices'
import { SectionName } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'
import { toSupportedChainId } from 'src/utils/chainId'
import { useNetworkColors } from 'src/utils/colors'
import { currencyId } from 'src/utils/currencyId'
import { flattenObjectOfObjects } from 'src/utils/objects'

interface TokenBalanceListProps {
  loading: boolean
  balances: ChainIdToAddressToCurrencyAmount
  refreshing: boolean
  onRefresh: () => void
  onPressToken: (currencyAmount: CurrencyAmount<Currency>) => void
}

interface TokenBalanceListHeaderProps {
  chainId: ChainId
}

function TokenBalanceListHeader({ chainId }: TokenBalanceListHeaderProps) {
  const colors = useNetworkColors(chainId)
  return (
    <Box bg="mainBackground" pb="sm" pt="md" px="lg">
      <Text style={{ color: colors.foreground }} variant="h5">
        {CHAIN_INFO[chainId].label}
      </Text>
    </Box>
  )
}

function balancesToSectionListData(balances: ChainIdToAddressToCurrencyAmount): {
  chainId: ChainId
  data: CurrencyAmount<Currency>[]
}[] {
  // Convert balances into array suitable for SectionList
  const chainIdToCurrencyAmounts = ALL_SUPPORTED_CHAIN_IDS.reduce<
    {
      chainId: ChainId
      data: CurrencyAmount<Currency>[]
    }[]
  >((acc, chainId) => {
    if (balances[chainId]) {
      const nonzeroBalances = Object.values(balances[chainId]!)
        .filter((currencyAmount: CurrencyAmount<Currency>) => !!currencyAmount?.greaterThan(0))
        .sort((a, b) => (a.lessThan(b) ? -1 : 1))
      if (nonzeroBalances.length > 0) {
        acc.push({
          chainId: chainId,
          data: nonzeroBalances,
        })
      }
    }

    return acc
  }, [])

  return chainIdToCurrencyAmounts
}

export function TokenBalanceList({
  balances,
  loading,
  refreshing,
  onRefresh,
  onPressToken,
}: TokenBalanceListProps) {
  const chainIdToCurrencyAmounts = useMemo(() => {
    return balancesToSectionListData(balances)
  }, [balances])

  const currenciesToFetch = flattenObjectOfObjects(balances).map(
    (currencyAmount) => currencyAmount.currency
  )
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
      <Box mt="xl">
        <ActivityIndicator animating={loading} color="grey" />
      </Box>
    )
  }

  return (
    <Trace logImpression section={SectionName.TokenBalance}>
      <SectionList
        keyExtractor={key}
        refreshing={refreshing}
        renderItem={renderItem}
        renderSectionHeader={({ section: { chainId } }) => (
          <TokenBalanceListHeader chainId={toSupportedChainId(chainId)!} />
        )}
        sections={chainIdToCurrencyAmounts}
        onRefresh={onRefresh}
      />
    </Trace>
  )
}

function key(balance: CurrencyAmount<Currency>) {
  return currencyId(balance.currency)
}
