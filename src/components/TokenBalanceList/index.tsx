import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, FlatList, ListRenderItemInfo, RefreshControl } from 'react-native'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { TokenBalanceItem } from 'src/components/TokenBalanceList/TokenBalanceItem'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { flex } from 'src/styles/flex'
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
    <Box px="lg" mb="md">
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
  const ethBalance = balances.length > 0 ? balances[0] : undefined

  if (loading || !ethBalance) {
    return (
      <Box flex={1} width="100%" alignItems="center">
        <ActivityIndicator color="grey" animating={loading} />
      </Box>
    )
  }

  const renderItem = ({ item }: ListRenderItemInfo<CurrencyAmount<Currency>>) => (
    <TokenBalanceItem currencyAmount={item} onPressToken={onPressToken} />
  )
  const key = (balance: CurrencyAmount<Currency>) =>
    balance.currency.isNative
      ? `${balance.currency.chainId}${NULL_ADDRESS}`
      : `${balance.currency.chainId}${balance.currency.address}`

  const totalBalance = balances
    .map((currencyAmount) => {
      // TODO get current price of each token - currently requires fetching token data from graph via a hook, need a more elegant way
      const currentPrice = 1
      return currentPrice * parseFloat(currencyAmount.toSignificant(6))
    })
    .reduce((a, b) => a + b, 0)
    .toFixed(2)

  return (
    <Box flex={1}>
      <FlatList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={flex.grow}
        data={balances}
        ListHeaderComponent={<TotalBalanceView totalBalance={totalBalance} />}
        renderItem={renderItem}
        keyExtractor={key}
      />
    </Box>
  )
}
