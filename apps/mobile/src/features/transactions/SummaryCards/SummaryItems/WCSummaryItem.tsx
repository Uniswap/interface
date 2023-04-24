import React from 'react'
import { DappLogoWithWCBadge } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import TransactionSummaryLayout, {
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { TransactionDetails, WCConfirmInfo } from 'src/features/transactions/types'

export default function WCSummaryItem({
  transaction,
}: {
  transaction: TransactionDetails & { typeInfo: WCConfirmInfo }
}): JSX.Element {
  return (
    <TransactionSummaryLayout
      caption={transaction.typeInfo.dapp.name}
      icon={
        <DappLogoWithWCBadge
          chainId={transaction.typeInfo.chainId}
          dappImageUrl={transaction.typeInfo.dapp.icon}
          dappName={transaction.typeInfo.dapp.name}
          size={TXN_HISTORY_ICON_SIZE}
        />
      }
      transaction={transaction}
    />
  )
}
