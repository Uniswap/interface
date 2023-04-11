import React from 'react'
import { LogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { AssetType } from 'src/entities/assets'
import TransactionSummaryLayout, {
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { NFTTradeTransactionInfo, TransactionDetails } from 'src/features/transactions/types'

export default function NFTTradeSummaryItem({
  transaction,
}: {
  transaction: TransactionDetails & { typeInfo: NFTTradeTransactionInfo }
}): JSX.Element {
  return (
    <TransactionSummaryLayout
      caption={transaction.typeInfo.nftSummaryInfo.name}
      icon={
        <LogoWithTxStatus
          assetType={AssetType.ERC721}
          nftImageUrl={transaction.typeInfo.nftSummaryInfo.imageURL}
          nftTradeType={transaction.typeInfo.tradeType}
          size={TXN_HISTORY_ICON_SIZE}
          txStatus={transaction.status}
          txType={transaction.typeInfo.type}
        />
      }
      transaction={transaction}
    />
  )
}
