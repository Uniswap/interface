import { skipToken } from '@reduxjs/toolkit/dist/query'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { BackX } from 'src/components/buttons/BackX'
import { TextButton } from 'src/components/buttons/TextButton'
import { Box, Flex } from 'src/components/layout'
import { CenterBox } from 'src/components/layout/CenterBox'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { Spacer } from 'src/components/layout/Spacer'
import { Text } from 'src/components/Text'
import { useTransactionHistoryQuery } from 'src/features/dataApi/zerion/api'
import { Namespace } from 'src/features/dataApi/zerion/types'
import { requests } from 'src/features/dataApi/zerion/utils'
import { clearNotificationCount } from 'src/features/notifications/notificationSlice'
import { useSortedTransactions } from 'src/features/transactions/hooks'
import {
  HistoricalTransactionSummaryCard,
  TransactionSummaryCard,
} from 'src/features/transactions/TransactionSummaryCard'
import { TransactionDetails } from 'src/features/transactions/types'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'
import { openUri } from 'src/utils/linking'

// For now, the notifications screen just shows transaction history/status
// If this does't change, it should maybe be renamed
export function NotificationsScreen() {
  const activeAccountAddress = useAppSelector(selectActiveAccountAddress)
  const onPressEtherscan = () => {
    // TODO consider offering chains other than just Mainnet
    openUri(`https://etherscan.io/address/${activeAccountAddress}`)
  }

  useClearNotificationCount(activeAccountAddress)

  const { currentData: txData } = useTransactionHistoryQuery(
    activeAccountAddress
      ? requests[Namespace.Address].transactions([activeAccountAddress])
      : skipToken
  )

  const allTransactionsFromApi = txData?.info?.[activeAccountAddress ?? ''] ?? []
  const localTransactions = useSortedTransactions(activeAccountAddress)?.reverse() ?? []

  const { t } = useTranslation()
  return (
    <SheetScreen flex={1} px="lg">
      <Box alignItems="center" flexDirection="row" justifyContent="space-between" mb="lg">
        <Text variant="body">{t('Transaction History')}</Text>
        <BackX size={16} />
      </Box>
      {activeAccountAddress && (
        <TextButton
          mt="md"
          px="xs"
          textColor="deprecated_gray600"
          textVariant="body"
          onPress={onPressEtherscan}>
          {t('View details on Etherscan')}
        </TextButton>
      )}

      {/* TODO: remove this ternary once local and remote txs are combined */}
      {localTransactions.length || allTransactionsFromApi.length ? (
        <Flex mt="sm">
          <FlatList data={localTransactions} keyExtractor={getTxKey} renderItem={ListItem} />
          <Text variant="body">{t('All transactions')}</Text>
          <FlatList
            ItemSeparatorComponent={() => <Spacer y="sm" />}
            data={allTransactionsFromApi}
            keyExtractor={(item) => item.hash}
            renderItem={({ item }) => <HistoricalTransactionSummaryCard tx={item} />}
          />
        </Flex>
      ) : (
        <EmptyList />
      )}
    </SheetScreen>
  )
}

function ListItem({ item }: ListRenderItemInfo<TransactionDetails>) {
  return (
    <Box mt="sm">
      <TransactionSummaryCard tx={item} />
    </Box>
  )
}

function EmptyList() {
  const { t } = useTranslation()
  return (
    <CenterBox flex={1}>
      <Text color="deprecated_gray600" p="lg" textAlign="center" variant="body">
        {t('No transactions yet, try making a swap from this wallet!')}
      </Text>
    </CenterBox>
  )
}

function getTxKey(tx: TransactionDetails) {
  return tx.chainId + tx.hash
}

function useClearNotificationCount(address: Address | null) {
  const dispatch = useAppDispatch()
  useEffect(() => {
    dispatch(clearNotificationCount({ address }))
  }, [dispatch, address])
}
