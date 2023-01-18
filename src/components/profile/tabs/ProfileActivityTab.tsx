import React from 'react'
import { useTranslation } from 'react-i18next'
import { NoTransactions } from 'src/components/icons/NoTransactions'
import { Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import TransactionList from 'src/components/TransactionList/TransactionList'
import { theme } from 'src/styles/theme'

export default function ProfileActivityTab({
  ownerAddress,
}: {
  ownerAddress: Address
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex grow style={{ paddingHorizontal: theme.spacing.sm }}>
      <TransactionList
        emptyStateContent={
          <Flex centered grow height="100%">
            <BaseCard.EmptyState
              description={t('When this wallet makes transactions, they’ll appear here.')}
              icon={<NoTransactions />}
              title={t('No activity yet')}
            />
          </Flex>
        }
        ownerAddress={ownerAddress}
        readonly={true}
      />
    </Flex>
  )
}
