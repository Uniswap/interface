import { useMemo } from 'react'
import { AssetType } from 'uniswap/src/entities/assets'
import {
  NFTApproveTransactionInfo,
  NFTMintTransactionInfo,
  NFTTradeTransactionInfo,
  TransactionDetails,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { LogoWithTxStatus } from 'wallet/src/components/CurrencyLogo/LogoWithTxStatus'
import { TransactionSummaryLayout } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransactionSummaryLayout'
import { SummaryItemProps } from 'wallet/src/features/transactions/SummaryCards/types'
import { TXN_HISTORY_ICON_SIZE } from 'wallet/src/features/transactions/SummaryCards/utils'

export function NFTSummaryItem({
  transaction,
  transactionType,
  index,
}: SummaryItemProps & {
  transaction: TransactionDetails & {
    typeInfo: NFTApproveTransactionInfo | NFTTradeTransactionInfo | NFTMintTransactionInfo
  }
  transactionType: TransactionType
}): JSX.Element {
  const icon = useMemo(
    () => (
      <LogoWithTxStatus
        assetType={AssetType.ERC721}
        chainId={transaction.chainId}
        nftImageUrl={transaction.typeInfo.nftSummaryInfo.imageURL}
        size={TXN_HISTORY_ICON_SIZE}
        txStatus={transaction.status}
        txType={transactionType}
      />
    ),
    [transaction.chainId, transaction.status, transaction.typeInfo.nftSummaryInfo.imageURL, transactionType],
  )

  return (
    <TransactionSummaryLayout
      caption={transaction.typeInfo.nftSummaryInfo.name}
      icon={icon}
      index={index}
      transaction={transaction}
    />
  )
}
