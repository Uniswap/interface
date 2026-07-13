import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, type GeneratedIcon, type IconProps, SpinningLoader, Text } from 'ui/src'
import { ArrowDownToLine } from 'ui/src/components/icons/ArrowDownToLine'
import { Receipt } from 'ui/src/components/icons/Receipt'
import { getTransactionSummaryTitle } from 'uniswap/src/features/activity/utils/getTransactionSummaryTitle'
import {
  TEMPORARY_TRANSACTION_STATUSES,
  TransactionDetails,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildActivityRowFragments } from '~/pages/Portfolio/Activity/ActivityTable/registry'
import { getTransactionTypeFilterOptions } from '~/pages/Portfolio/Activity/Filters/utils'

interface TransactionTypeCellProps {
  transaction: TransactionDetails
}

interface TransactionTypeCellIconProps {
  IconComponent: GeneratedIcon
  rotate?: IconProps['rotate']
}

interface GetTransactionTypeCellIconPropsParams {
  transactionType: TransactionType
  groupIcon: GeneratedIcon | null | undefined
  isVaultWithdraw?: boolean
}

export function getTransactionTypeCellIconProps({
  transactionType,
  groupIcon,
  isVaultWithdraw = false,
}: GetTransactionTypeCellIconPropsParams): TransactionTypeCellIconProps {
  switch (transactionType) {
    case TransactionType.Deposit:
      return { IconComponent: ArrowDownToLine }
    case TransactionType.Withdraw:
      return isVaultWithdraw
        ? { IconComponent: ArrowDownToLine, rotate: '180deg' }
        : { IconComponent: groupIcon ?? Receipt }
    default:
      return { IconComponent: groupIcon ?? Receipt }
  }
}

function TransactionTypeCellInner({ transaction }: TransactionTypeCellProps) {
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
  const isVaultWithdraw = transaction.typeInfo.type === TransactionType.Withdraw && transaction.typeInfo.isVault
  const { IconComponent, rotate } = getTransactionTypeCellIconProps({
    transactionType: transaction.typeInfo.type,
    groupIcon: typeOption?.icon,
    isVaultWithdraw,
  })

  // Use override label key if provided, otherwise use the base group label
  const label = typeLabel?.overrideLabelKey
    ? t(typeLabel.overrideLabelKey)
    : (typeOption?.label ?? t('transaction.details.transaction'))

  return (
    <Flex row alignItems="center" gap="$gap8">
      <IconComponent size="$icon.16" color="$neutral1" rotate={rotate} />
      <Text variant="body3">{label}</Text>
    </Flex>
  )
}

export const TransactionTypeCell = memo(TransactionTypeCellInner)
