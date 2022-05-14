import { skipToken } from '@reduxjs/toolkit/dist/query'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
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
import { useSortedTransactions } from 'src/features/transactions/hooks'
import {
  HistoricalTransactionSummaryCard,
  TransactionSummaryCard,
} from 'src/features/transactions/TransactionSummaryCard'
import { TransactionDetails } from 'src/features/transactions/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { openUri } from 'src/utils/linking'

// For now, the notifications screen just shows transaction history/status
// If this does't change, it should maybe be renamed
export function NotificationsScreen() {
  const activeAccount = useActiveAccount()
  const onPressEtherscan = () => {
    // TODO consider offering chains other than just Mainnet
    openUri(`https://etherscan.io/address/${activeAccount?.address}`)
  }

  const transactions = useSortedTransactions(true)

  const { currentData: historicalTransactions } = useTransactionHistoryQuery(
    activeAccount ? requests[Namespace.Address].transactions(activeAccount.address) : skipToken
  )

  const { t } = useTranslation()
  return (
    <SheetScreen flex={1} px="lg">
      <Box alignItems="center" flexDirection="row" justifyContent="space-between" mb="lg">
        <Text variant="bodyBold">{t('Transaction History')}</Text>
        <BackX size={16} />
      </Box>
      {activeAccount && (
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
      {transactions.length > 0 || (historicalTransactions?.info?.length ?? 0) > 0 ? (
        <Flex mt="sm">
          <FlatList data={transactions} keyExtractor={getTxKey} renderItem={ListItem} />
          <Text variant="body">{t('All transactions')}</Text>
          <FlatList
            ItemSeparatorComponent={() => <Spacer y="sm" />}
            data={historicalTransactions?.info}
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
