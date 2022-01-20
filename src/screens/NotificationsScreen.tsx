import React from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { BackButton } from 'src/components/buttons/BackButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { Flex } from 'src/components/layout'
import { CenterBox } from 'src/components/layout/CenterBox'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { Spacer } from 'src/components/layout/Spacer'
import { Text } from 'src/components/Text'
import { useSortedTransactions } from 'src/features/transactions/hooks'
import { TransactionSummaryCard } from 'src/features/transactions/TransactionSummaryCard'
import { TransactionDetails } from 'src/features/transactions/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { flex } from 'src/styles/flex'
import { openUri } from 'src/utils/linking'

// For now, the notifications screen just shows transaction history/status
// If this does't change, it should maybe be renamed
export function NotificationsScreen() {
  const activeAccount = useActiveAccount()
  const onPressEtherscan = () => {
    // TODO consider offering chains other than just Mainnet
    openUri(`https://etherscan.io/address/${activeAccount?.address}`)
  }

  const transactions = useSortedTransactions()

  const { t } = useTranslation()
  return (
    <SheetScreen flex={1} px="lg">
      <Flex alignItems="center" flexDirection="row" gap="md">
        <BackButton />
        <Text variant="bodyLg">{t('Transaction History')}</Text>
      </Flex>
      {activeAccount && (
        <TextButton
          mt="md"
          px="xs"
          textColor="gray600"
          textVariant="body"
          onPress={onPressEtherscan}>
          {t('View details on Etherscan')}
        </TextButton>
      )}
      <Spacer y="lg" />
      <FlatList
        ListEmptyComponent={EmptyList}
        contentContainerStyle={flex.fill}
        data={transactions}
        keyExtractor={getTxKey}
        renderItem={ListItem}
      />
    </SheetScreen>
  )
}

function ListItem({ item }: ListRenderItemInfo<TransactionDetails>) {
  return <TransactionSummaryCard tx={item} />
}

function EmptyList() {
  const { t } = useTranslation()
  return (
    <CenterBox flex={1}>
      <Text color="gray600" p="lg" textAlign="center" variant="body">
        {t('No transactions yet, try making a swap from this wallet!')}
      </Text>
    </CenterBox>
  )
}

function getTxKey(tx: TransactionDetails) {
  return tx.chainId + tx.hash
}
