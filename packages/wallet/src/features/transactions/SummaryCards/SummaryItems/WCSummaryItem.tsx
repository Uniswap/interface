import { useMemo } from 'react'
import { TransactionDetails, WCConfirmInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { DappLogoWithWCBadge } from 'wallet/src/components/CurrencyLogo/LogoWithTxStatus'
import { TransactionSummaryLayout } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransactionSummaryLayout'
import { SummaryItemProps } from 'wallet/src/features/transactions/SummaryCards/types'
import { TXN_HISTORY_ICON_SIZE } from 'wallet/src/features/transactions/SummaryCards/utils'

export function WCSummaryItem({
  transaction,
  index,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: WCConfirmInfo }
}): JSX.Element {
  const icon = useMemo(
    () => (
      <DappLogoWithWCBadge
        chainId={transaction.chainId}
        dappImageUrl={transaction.typeInfo.dappRequestInfo.icon}
        dappName={transaction.typeInfo.dappRequestInfo.name}
        size={TXN_HISTORY_ICON_SIZE}
      />
    ),
    [transaction.chainId, transaction.typeInfo.dappRequestInfo.icon, transaction.typeInfo.dappRequestInfo.name],
  )

  return (
    <TransactionSummaryLayout
      caption={transaction.typeInfo.dappRequestInfo.name}
      icon={icon}
      index={index}
      transaction={transaction}
    />
  )
}
