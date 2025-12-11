import { useMemo } from 'react'
import { TransactionSummaryLayout } from 'uniswap/src/components/activity/summaries/TransactionSummaryLayout'
import { SummaryItemProps } from 'uniswap/src/components/activity/types'
import { TXN_HISTORY_ICON_SIZE } from 'uniswap/src/components/activity/utils'
import { LogoWithTxStatus } from 'uniswap/src/components/CurrencyLogo/LogoWithTxStatus'
import { AssetType } from 'uniswap/src/entities/assets'
import {
  NFTApproveTransactionInfo,
  NFTMintTransactionInfo,
  NFTTradeTransactionInfo,
  TransactionDetails,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'

export function NFTSummaryItem({
  transaction,
  transactionType,
  index,
  isExternalProfile,
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
      isExternalProfile={isExternalProfile}
      transaction={transaction}
    />
  )
}
