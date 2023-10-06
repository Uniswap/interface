import { createElement } from 'react'
import { DappLogoWithWCBadge } from 'wallet/src/components/CurrencyLogo/LogoWithTxStatus'
import {
  SummaryItemProps,
  TransactionSummaryLayoutProps,
} from 'wallet/src/features/transactions/SummaryCards/types'
import { TXN_HISTORY_ICON_SIZE } from 'wallet/src/features/transactions/SummaryCards/utils'
import { TransactionDetails, WCConfirmInfo } from 'wallet/src/features/transactions/types'

export function WCSummaryItem({
  transaction,
  layoutElement,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: WCConfirmInfo }
}): JSX.Element {
  return createElement(layoutElement as React.FunctionComponent<TransactionSummaryLayoutProps>, {
    caption: transaction.typeInfo.dapp.name,
    icon: (
      <DappLogoWithWCBadge
        chainId={transaction.chainId}
        dappImageUrl={transaction.typeInfo.dapp.icon}
        dappName={transaction.typeInfo.dapp.name}
        size={TXN_HISTORY_ICON_SIZE}
      />
    ),
    transaction,
  })
}
