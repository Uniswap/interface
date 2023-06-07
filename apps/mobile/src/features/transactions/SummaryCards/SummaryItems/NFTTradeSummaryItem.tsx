import React from 'react'
import { LogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import TransactionSummaryLayout, {
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { AssetType } from 'wallet/src/entities/assets'
import { NFTTradeTransactionInfo, TransactionDetails } from 'wallet/src/features/transactions/types'

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
          chainId={transaction.chainId}
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
