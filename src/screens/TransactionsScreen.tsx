import React from 'react'
import { useTranslation } from 'react-i18next'
import { ExploreStackScreenProp } from 'src/app/navigation/types'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { Text } from 'src/components/Text'
import { TransactionList } from 'src/components/TransactionList/TransactionList'
import { useAllFormattedTransactions } from 'src/features/transactions/hooks'
import { Screens } from 'src/screens/Screens'

export function TransactionsScreen({
  route: {
    params: { owner },
  },
}: ExploreStackScreenProp<Screens.UserTransactions>) {
  const { t } = useTranslation()
  const transactions = useAllFormattedTransactions(owner)

  return (
    <HeaderScrollScreen
      contentHeader={
        <Flex pt="md">
          <BackHeader>
            <AddressDisplay
              address={owner}
              color="textSecondary"
              horizontalGap="xs"
              size={16}
              variant="subhead"
            />
          </BackHeader>
          <Text variant="headlineSmall">{t('Transactions')}</Text>
        </Flex>
      }
      fixedHeader={
        <BackHeader>
          <Flex centered gap="none">
            <AddressDisplay address={owner} size={16} variant="subhead" />
            <Text color="accentTextLightSecondary" variant="subheadSmall">
              {t('Transactions')}
            </Text>
          </Flex>
        </BackHeader>
      }>
      <Flex pb="lg" px="sm">
        <TransactionList readonly={true} transactions={transactions} />
      </Flex>
    </HeaderScrollScreen>
  )
}
