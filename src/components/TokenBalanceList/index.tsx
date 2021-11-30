import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React from 'react'
import { ActivityIndicator, FlatList, ListRenderItemInfo } from 'react-native'
import { Box } from 'src/components/layout/Box'
import { PriceChart } from 'src/components/PriceChart'
import { TokenBalanceItem } from 'src/components/TokenBalanceList/TokenBalanceItem'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { flex } from 'src/styles/flex'

interface TokenBalanceListProps {
  loading: boolean
  balances: CurrencyAmount<Currency>[]
  onPressToken: (currencyAmount: CurrencyAmount<Currency>) => void
}

export function TokenBalanceList({ loading, balances, onPressToken }: TokenBalanceListProps) {
  // TODO: Sum balances across tokens to display total portfolio value for <PriceChart>
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
    balance.currency.isNative ? NULL_ADDRESS : balance.currency.address

  return (
    <Box flex={1}>
      <FlatList
        contentContainerStyle={flex.grow}
        data={balances}
        ListHeaderComponent={<PriceChart token={ethBalance!.currency.wrapped} />}
        renderItem={renderItem}
        keyExtractor={key}
      />
    </Box>
  )
}
