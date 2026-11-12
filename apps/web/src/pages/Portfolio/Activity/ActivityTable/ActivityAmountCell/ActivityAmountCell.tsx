import { Text } from '@universe/mycelium'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { TransactionDetails, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ApproveAmountCell } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/ApproveAmountCell'
import { EmptyCell } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/EmptyCell'
import { GenericCompactLayout } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/GenericCompactLayout'
import { LiquidityPairAmountCell } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/LiquidityPairAmountCell'
import { MultiTokenAmountCell } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/MultiTokenAmountCell'
import { NftAmountCell } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/NftAmountCell'
import { PairAmountCell } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/PairAmountCell'
import { SingleAmountCell } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/SingleAmountCell'
import { WrapAmountCell } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/WrapAmountCell'
import { ActivityCellVariant, ActivityProtocolInfo } from '~/pages/Portfolio/Activity/ActivityTable/activityTableModels'
import { buildActivityRowFragments } from '~/pages/Portfolio/Activity/ActivityTable/registry'

interface ActivityAmountCellProps {
  transaction: TransactionDetails
  variant?: ActivityCellVariant
}

interface FailedAmountDisplayProps {
  transaction: TransactionDetails
  protocolInfo: ActivityProtocolInfo | null | undefined
  variant: ActivityCellVariant
}

function FailedAmountDisplay({ transaction, protocolInfo, variant }: FailedAmountDisplayProps): JSX.Element {
  const { t } = useTranslation()

  if (variant === 'compact') {
    return (
      <GenericCompactLayout
        transaction={transaction}
        protocolInfo={protocolInfo}
        labelOverride={t('transaction.status.confirm.failed')}
      />
    )
  }

  return (
    <Text variant="body3" color="$neutral2">
      {t('notification.transaction.unknown.fail.short')}
    </Text>
  )
}

function ActivityAmountCellInner({ transaction, variant = 'full' }: ActivityAmountCellProps): JSX.Element {
  const { amount, protocolInfo } = buildActivityRowFragments(transaction)

  if (transaction.status === TransactionStatus.Failed) {
    return <FailedAmountDisplay transaction={transaction} protocolInfo={protocolInfo} variant={variant} />
  }

  if (!amount) {
    if (variant === 'compact') {
      return <GenericCompactLayout transaction={transaction} protocolInfo={protocolInfo} />
    }
    return <EmptyCell />
  }

  switch (amount.kind) {
    case 'pair':
      return <PairAmountCell transaction={transaction} amount={amount} variant={variant} />
    case 'single':
      return <SingleAmountCell transaction={transaction} amount={amount} variant={variant} />
    case 'wrap':
      return <WrapAmountCell transaction={transaction} amount={amount} variant={variant} />
    case 'liquidity-pair':
      return <LiquidityPairAmountCell transaction={transaction} amount={amount} variant={variant} />
    case 'multi-token':
      return <MultiTokenAmountCell transaction={transaction} amount={amount} variant={variant} />
    case 'nft':
      return <NftAmountCell transaction={transaction} amount={amount} variant={variant} />
    case 'approve':
      return <ApproveAmountCell transaction={transaction} amount={amount} variant={variant} />
    default:
      return <EmptyCell />
  }
}

export const ActivityAmountCell = memo(ActivityAmountCellInner, (prev, next) => {
  return (
    prev.transaction.typeInfo === next.transaction.typeInfo &&
    prev.transaction.status === next.transaction.status &&
    prev.variant === next.variant
  )
})
ActivityAmountCell.displayName = 'ActivityAmountCell'
