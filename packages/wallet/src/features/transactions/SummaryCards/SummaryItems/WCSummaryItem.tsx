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
        dappImageUrl={transaction.typeInfo.dapp.icon}
        dappName={transaction.typeInfo.dapp.name}
        size={TXN_HISTORY_ICON_SIZE}
      />
    ),
    [transaction.chainId, transaction.typeInfo.dapp.icon, transaction.typeInfo.dapp.name],
  )

  return (
    <TransactionSummaryLayout
      caption={transaction.typeInfo.dapp.name}
      icon={icon}
      index={index}
      transaction={transaction}
    />
  )
}
