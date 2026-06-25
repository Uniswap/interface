import { OnChainTransaction } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { extractDappInfo } from 'uniswap/src/features/activity/utils/extractDappInfo'
import { NFTMintTransactionInfo, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

export function parseNFTMintTransaction(transaction: OnChainTransaction): NFTMintTransactionInfo | undefined {
  const { transfers } = transaction
  const firstTransfer = transfers[0]
  if (!firstTransfer || firstTransfer.asset.case !== 'nft') {
    return undefined
  }
  const nftTransfer = firstTransfer.asset.value
  const { tokenId, address } = nftTransfer
  if (!tokenId || !address) {
    return undefined
  }
  return {
    type: TransactionType.NFTMint,
    nftSummaryInfo: {
      name: nftTransfer.name,
      collectionName: nftTransfer.collectionName,
      imageURL: nftTransfer.imageUrl,
      tokenId,
      address,
    },
    purchaseCurrencyId: buildCurrencyId(nftTransfer.chainId, address),
    purchaseCurrencyAmountRaw: transaction.fee?.amount?.raw,
    transactedUSDValue: undefined,
    dappInfo: extractDappInfo(transaction),
    isSpam: nftTransfer.isSpam,
  }
}
