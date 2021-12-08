import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { TokenBalanceItem } from 'src/components/TokenBalanceList/TokenBalanceItem'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { ChainId, MAINNET_CHAIN_IDS } from 'src/constants/chains'
import { useTokenPrices } from 'src/features/historicalChainData/useTokenPrices'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { currencyId } from 'src/utils/currencyId'
import { formatPrice } from 'src/utils/format'

interface TokenBalanceListProps {
  loading: boolean
  balances: CurrencyAmount<Currency>[]
  refreshing: boolean
  onRefresh: () => void
  onPressToken: (currencyAmount: CurrencyAmount<Currency>) => void
}

interface TotalBalanceViewProps {
  totalBalance: string
}

function TotalBalanceView({ totalBalance }: TotalBalanceViewProps) {
  const { t } = useTranslation()

  return (
    <Box mt="sm" mb="lg" mx="lg">
      <Text variant="h5" color="gray400" mb="xs">
        {t('Total balance')}
      </Text>
      <Text variant="h1">{`${formatPrice(totalBalance)}`}</Text>
    </Box>
  )
}

export function TokenBalanceList({
  loading,
  balances,
  refreshing,
  onRefresh,
  onPressToken,
}: TokenBalanceListProps) {
  const { height } = useWindowDimensions()

  const ethBalance = balances.length > 0 ? balances[0] : undefined
  const currenciesToFetch = balances.map((currencyAmount) => currencyAmount.currency)
  const tokenPricesByChain = useTokenPrices(currenciesToFetch)

  const totalBalance = useTotalBalance(loading || !ethBalance ? [] : balances, tokenPricesByChain)

  if (loading || !ethBalance) {
    return (
      <Box padding="xl">
        <ActivityIndicator color="grey" animating={loading} />
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

  // Return white footer to fill bottom of FlatList over the gradient
  return (
    <FlatList
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContainer}
      data={balances}
      ListHeaderComponent={<TotalBalanceView totalBalance={totalBalance} />}
      ListFooterComponent={
        <Box
          bg="mainBackground"
          style={{
            height,
          }}
        />
      }
      renderItem={renderItem}
      keyExtractor={key}
    />
  )
}

function useTotalBalance(
  balances: CurrencyAmount<Currency>[],
  tokenPricesByChain: ReturnType<typeof useTokenPrices>
) {
  const activeAccount = useActiveAccount()
  const filteredBalances =
    activeAccount?.type === AccountType.readonly
      ? balances.filter((currencyAmount) =>
          MAINNET_CHAIN_IDS.includes(currencyAmount.currency.chainId)
        )
      : balances

  return filteredBalances
    .map((currencyAmount) => {
      const currentPrice =
        tokenPricesByChain.chainIdToPrices[currencyAmount.currency.chainId as ChainId]
          ?.addressToPrice?.[currencyId(currencyAmount.currency)]?.priceUSD

      return (currentPrice ?? 0) * parseFloat(currencyAmount.toSignificant(6))
    })
    .reduce((a, b) => a + b, 0)
    .toFixed(2)
}

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    flexGrow: 1,
  },
})
