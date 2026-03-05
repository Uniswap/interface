import { Direction, OnChainTransaction, OnChainTransactionLabel } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { extractDappInfo } from 'uniswap/src/features/activity/utils/extractDappInfo'
import { AssetCase } from 'uniswap/src/features/activity/utils/remote'
import {
  AuctionBidTransactionInfo,
  AuctionClaimedTransactionInfo,
  AuctionExitedTransactionInfo,
  TransactionType,
  UnknownTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'

export function parseRestAuctionTransaction(
  transaction: OnChainTransaction,
): AuctionBidTransactionInfo | AuctionClaimedTransactionInfo | AuctionExitedTransactionInfo | UnknownTransactionInfo {
  const { transfers, label, to } = transaction

  const dappInfo = extractDappInfo(transaction)

  if (label === OnChainTransactionLabel.AUCTION_SUBMIT_BID) {
    const sendTransfer = transfers.find((t) => t.direction === Direction.SEND)
    if (sendTransfer?.asset.case === AssetCase.Token && sendTransfer.amount?.raw) {
      return {
        type: TransactionType.AuctionBid,
        auctionContractAddress: to,
        bidTokenAddress: sendTransfer.asset.value.address,
        amountRaw: sendTransfer.amount.raw,
        isSpam: false,
        dappInfo,
      }
    }
  }

  if (
    label === OnChainTransactionLabel.AUCTION_CLAIM_TOKENS ||
    label === OnChainTransactionLabel.AUCTION_CLAIM_TOKENS_BATCHED
  ) {
    const receiveTransfer = transfers.find((t) => t.direction === Direction.RECEIVE)
    if (receiveTransfer?.asset.case === AssetCase.Token && receiveTransfer.amount?.raw) {
      return {
        type: TransactionType.AuctionClaimed,
        auctionContractAddress: to,
        tokenAddress: receiveTransfer.asset.value.address,
        amountRaw: receiveTransfer.amount.raw,
        isSpam: false,
        dappInfo,
      }
    }
  }

  if (
    label === OnChainTransactionLabel.AUCTION_EXIT_BID ||
    label === OnChainTransactionLabel.AUCTION_EXIT_PARTIALLY_FILLED_BID
  ) {
    const receiveTransfer = transfers.find((t) => t.direction === Direction.RECEIVE)
    if (receiveTransfer?.asset.case === AssetCase.Token && receiveTransfer.amount?.raw) {
      return {
        type: TransactionType.AuctionExited,
        auctionContractAddress: to,
        tokenAddress: receiveTransfer.asset.value.address,
        amountRaw: receiveTransfer.amount.raw,
        isSpam: false,
        dappInfo,
      }
    }
  }

  return {
    type: TransactionType.Unknown,
    isSpam: false,
    dappInfo,
  }
}
