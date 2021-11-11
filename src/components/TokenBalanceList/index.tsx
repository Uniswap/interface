import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React from 'react'
import { ActivityIndicator, FlatList, ListRenderItemInfo } from 'react-native'
import { TokenBalanceItem } from 'src/components/TokenBalanceList/TokenBalanceItem'
import { NULL_ADDRESS } from 'src/constants/accounts'

interface TokenBalanceListProps {
  loading: boolean
  balances: CurrencyAmount<Currency>[]
}

export function TokenBalanceList({ loading, balances }: TokenBalanceListProps) {
  if (loading) return <ActivityIndicator color="grey" animating={loading} />

  const renderItem = ({ item }: ListRenderItemInfo<CurrencyAmount<Currency>>) => (
    <TokenBalanceItem currencyAmount={item} />
  )
  const key = (balance: CurrencyAmount<Currency>) =>
    balance.currency.isNative ? NULL_ADDRESS : balance.currency.address

  return <FlatList data={balances} renderItem={renderItem} keyExtractor={key} />
}
