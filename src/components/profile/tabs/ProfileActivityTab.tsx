import React from 'react'
import { useTranslation } from 'react-i18next'
import { NoTransactions } from 'src/components/icons/NoTransactions'
import { Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { TAB_STYLES } from 'src/components/layout/TabHelpers'
import TransactionList from 'src/components/TransactionList/TransactionList'

export default function ProfileActivityTab({ ownerAddress }: { ownerAddress: Address }) {
  const { t } = useTranslation()
  return (
    <Flex grow style={TAB_STYLES.tabContentContainerStandard}>
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
