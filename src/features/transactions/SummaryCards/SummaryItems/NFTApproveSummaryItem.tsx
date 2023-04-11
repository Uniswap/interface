import React from 'react'
import { LogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { AssetType } from 'src/entities/assets'
import TransactionSummaryLayout, {
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import {
  NFTApproveTransactionInfo,
  TransactionDetails,
  TransactionType,
} from 'src/features/transactions/types'

export default function NFTApproveSummaryItem({
  transaction,
}: {
  transaction: TransactionDetails & { typeInfo: NFTApproveTransactionInfo }
}): JSX.Element {
  return (
    <TransactionSummaryLayout
      caption={transaction.typeInfo.nftSummaryInfo.name}
      icon={
        <LogoWithTxStatus
          assetType={AssetType.ERC721}
          size={TXN_HISTORY_ICON_SIZE}
          txStatus={transaction.status}
          txType={TransactionType.NFTApprove}
        />
      }
      transaction={transaction}
    />
  )
}
