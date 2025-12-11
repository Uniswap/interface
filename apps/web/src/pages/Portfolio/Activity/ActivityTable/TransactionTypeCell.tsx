import { buildActivityRowFragments } from 'pages/Portfolio/Activity/ActivityTable/registry'
import { getTransactionTypeFilterOptions } from 'pages/Portfolio/Activity/Filters/utils'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, SpinningLoader, Text } from 'ui/src'
import { Receipt } from 'ui/src/components/icons/Receipt'
import { getTransactionSummaryTitle } from 'uniswap/src/features/activity/utils/getTransactionSummaryTitle'
import {
  TEMPORARY_TRANSACTION_STATUSES,
  TransactionDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'

interface TransactionTypeCellProps {
  transaction: TransactionDetails
}

function _TransactionTypeCell({ transaction }: TransactionTypeCellProps) {
  const { t } = useTranslation()
  const isTemporaryStatus = TEMPORARY_TRANSACTION_STATUSES.includes(transaction.status)

  if (isTemporaryStatus) {
    const pendingLabel = getTransactionSummaryTitle(transaction, t) ?? t('transaction.details.transaction')

    return (
      <Flex row alignItems="center" gap="$gap8">
        <SpinningLoader color="$accent1" size={16} />
        <Text variant="body3">{pendingLabel}</Text>
      </Flex>
    )
  }

  const { typeLabel } = buildActivityRowFragments(transaction)

  // Get the icon from the filter options based on base group
  const transactionTypeOptions = getTransactionTypeFilterOptions(t)
  const typeOption = typeLabel?.baseGroup ? transactionTypeOptions[typeLabel.baseGroup] : null
  const IconComponent = typeOption?.icon ?? Receipt

  // Use override label key if provided, otherwise use the base group label
  const label = typeLabel?.overrideLabelKey
    ? t(typeLabel.overrideLabelKey)
    : (typeOption?.label ?? t('transaction.details.transaction'))

  return (
    <Flex row alignItems="center" gap="$gap8">
      <IconComponent size="$icon.16" color="$neutral1" />
      <Text variant="body3">{label}</Text>
    </Flex>
  )
}

export const TransactionTypeCell = memo(_TransactionTypeCell)
