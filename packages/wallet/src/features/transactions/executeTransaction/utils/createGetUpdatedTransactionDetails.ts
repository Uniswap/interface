import { providers } from 'ethers'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  OnChainTransactionDetails,
  TransactionStatus,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { getSerializableTransactionRequest } from 'wallet/src/features/transactions/utils'

export function createGetUpdatedTransactionDetails(ctx: {
  getBlockNumber: () => Promise<number>
  isPrivateRpc: boolean
}): (input: {
  transaction: OnChainTransactionDetails
  hash: string
  timestampBeforeSign: number
  timestampBeforeSend: number
  populatedRequest: providers.TransactionRequest
}) => Promise<OnChainTransactionDetails & { hash: string }> {
  return async function getUpdatedTransactionDetails(input: {
    transaction: OnChainTransactionDetails
    hash: string
    timestampBeforeSign: number
    timestampBeforeSend: number
    populatedRequest: providers.TransactionRequest
  }): Promise<OnChainTransactionDetails & { hash: string }> {
    const { transaction, hash, timestampBeforeSign, timestampBeforeSend, populatedRequest } = input
    const timestampAfterSend = Date.now()
    const blockNumber = await ctx.getBlockNumber()
    const currentBlockFetchDelayMs = Date.now() - timestampAfterSend
    const request = getSerializableTransactionRequest(populatedRequest, transaction.chainId)
    const timeoutTimestampMs = timestampAfterSend + getTransactionTimeoutMs(transaction.chainId)
    const privateRpcProvider = ctx.isPrivateRpc
      ? 'flashbots'
      : transaction.options.submitViaPrivateRpc
        ? 'mevblocker'
        : undefined

    const updatedTransaction: OnChainTransactionDetails & { hash: string } = {
      ...transaction,
      hash,
      status: TransactionStatus.Pending,
      options: {
        ...transaction.options,
        request,
        rpcSubmissionTimestampMs: timestampAfterSend,
        rpcSubmissionDelayMs: timestampAfterSend - timestampBeforeSend,
        signTransactionDelayMs: timestampBeforeSend - timestampBeforeSign,
        currentBlockFetchDelayMs,
        timeoutTimestampMs,
        privateRpcProvider,
        blockSubmitted: blockNumber,
      },
    }
    return updatedTransaction
  }
}

// This timeout is used to trigger a log event and make the transaction clearable if it's been pending for too long
const getTransactionTimeoutMs = (chainId: UniverseChainId): number => {
  if (chainId === UniverseChainId.Mainnet) {
    return 10 * ONE_MINUTE_MS
  }
  return ONE_MINUTE_MS
}
