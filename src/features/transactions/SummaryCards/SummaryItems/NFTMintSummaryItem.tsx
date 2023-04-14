import React from 'react'
import { LogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { AssetType } from 'src/entities/assets'
import TransactionSummaryLayout, {
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import {
  NFTMintTransactionInfo,
  TransactionDetails,
  TransactionType,
} from 'src/features/transactions/types'

export default function NFTMintSummaryItem({
  transaction,
}: {
  transaction: TransactionDetails & { typeInfo: NFTMintTransactionInfo }
}): JSX.Element {
  return (
    <TransactionSummaryLayout
      caption={transaction.typeInfo.nftSummaryInfo.name}
      icon={
        <LogoWithTxStatus
          assetType={AssetType.ERC721}
          chainId={transaction.chainId}
          nftImageUrl={transaction.typeInfo.nftSummaryInfo.imageURL}
          size={TXN_HISTORY_ICON_SIZE}
          txStatus={transaction.status}
          txType={TransactionType.NFTMint}
        />
      }
      transaction={transaction}
    />
  )
}
