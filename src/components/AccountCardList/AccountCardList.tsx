import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React, { useRef } from 'react'
import { FlatList, ListRenderItemInfo, ViewabilityConfig, ViewToken } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { AccountCardItem } from 'src/components/AccountCardList/AccountCardItem'
import { Account } from 'src/features/wallet/accounts/types'
import { useAccounts, useActiveAccount } from 'src/features/wallet/hooks'
import { activateAccount } from 'src/features/wallet/walletSlice'

interface AccountCardListProps {
  balances: CurrencyAmount<Currency>[]
  onPressQRCode: () => void
  onPressSend: () => void
}

const viewabilityConfig: ViewabilityConfig = {
  waitForInteraction: true,
  itemVisiblePercentThreshold: 75,
}

const key = (account: Account) => account.address

export function AccountCardList({ balances, onPressQRCode, onPressSend }: AccountCardListProps) {
  const addressToAccount = useAccounts()
  const accounts = Object.values(addressToAccount)
  const activeAccount = useActiveAccount()

  const dispatch = useAppDispatch()
  const onPressActivate = (address: Address) => {
    dispatch(activateAccount(address))
  }

  const onViewableItemsChanged = (info: {
    viewableItems: Array<ViewToken>
    changed: Array<ViewToken>
  }) => {
    const { viewableItems } = info
    // safeguard for when callback called without viewable items
    if (viewableItems.length !== 0) {
      const address = viewableItems[0].key
      dispatch(activateAccount(address))
    }
  }

  const viewabilityConfigCallbackPair = useRef([{ viewabilityConfig, onViewableItemsChanged }])

  const renderItem = ({ item }: ListRenderItemInfo<Account>) => (
    <AccountCardItem
      account={item}
      balances={balances}
      isActive={!!activeAccount && activeAccount.address === item.address}
      onPress={onPressActivate}
      onPressQRCode={onPressQRCode}
      onPressSend={onPressSend}
    />
  )

  return (
    <FlatList
      horizontal
      pagingEnabled
      data={accounts}
      decelerationRate="fast"
      keyExtractor={key}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
      snapToAlignment="start"
      viewabilityConfigCallbackPairs={viewabilityConfigCallbackPair.current}
    />
  )
}
