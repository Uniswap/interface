import { createElement } from 'react'
import { LogoWithTxStatus } from 'wallet/src/components/CurrencyLogo/LogoWithTxStatus'
import { AssetType } from 'wallet/src/entities/assets'
import {
  SummaryItemProps,
  TransactionSummaryLayoutProps,
} from 'wallet/src/features/transactions/SummaryCards/types'
import { TXN_HISTORY_ICON_SIZE } from 'wallet/src/features/transactions/SummaryCards/utils'
import {
  NFTApproveTransactionInfo,
  NFTMintTransactionInfo,
  NFTTradeTransactionInfo,
  TransactionDetails,
  TransactionType,
} from 'wallet/src/features/transactions/types'

export function NFTSummaryItem({
  transaction,
  transactionType,
  layoutElement,
}: SummaryItemProps & {
  transaction: TransactionDetails & {
    typeInfo: NFTApproveTransactionInfo | NFTTradeTransactionInfo | NFTMintTransactionInfo
  }
  transactionType: TransactionType
}): JSX.Element {
  return createElement(layoutElement as React.FunctionComponent<TransactionSummaryLayoutProps>, {
    caption: transaction.typeInfo.nftSummaryInfo.name,
    icon: (
      <LogoWithTxStatus
        assetType={AssetType.ERC721}
        chainId={transaction.chainId}
        nftImageUrl={transaction.typeInfo.nftSummaryInfo.imageURL}
        size={TXN_HISTORY_ICON_SIZE}
        txStatus={transaction.status}
        txType={transactionType}
      />
    ),
    transaction,
  })
}
