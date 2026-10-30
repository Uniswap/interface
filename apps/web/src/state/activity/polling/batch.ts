import { isEVMChain } from '@universe/chains'
import { isValidHexString } from '@universe/encoding'
import { getPublicClient } from '@wagmi/core'
import { useEffect, useMemo } from 'react'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { ONE_HOUR_MS } from 'utilities/src/time/time'
import type { GetCallsStatusResult, GetCallsStatusTransactionReceipt } from 'wallet/src/features/dappRequests/types'
import type { Web3Provider } from '~/chains'
import { wagmiConfig } from '~/connection/wagmiConfig'
import { useAccount } from '~/hooks/useAccount'
import { useEthersWeb3Provider } from '~/hooks/useEthersProvider'
import { ActivityUpdateTransactionType, OnActivityUpdate } from '~/state/activity/types'
import { usePendingTransactions } from '~/state/transactions/hooks'
import { PendingTransactionDetails } from '~/state/transactions/types'

type PendingBatchDetails = Required<Pick<PendingTransactionDetails, 'batchInfo'>> & PendingTransactionDetails

function usePendingBatches(): PendingBatchDetails[] {
  const transactions = usePendingTransactions()
  const account = useAccount()

  return useMemo(() => {
    if (account.status === 'connected') {
      const connectorId = account.connector.id

      const shouldAttemptCheck = (tx: PendingTransactionDetails): tx is PendingBatchDetails => {
        const isBatch = tx.batchInfo !== undefined
        const batchConnectorId = tx.batchInfo?.connectorId
        // Don't attempt to check batches where the stored connector ID differs from the current connector.
        // Only the wallet that processed the batch will be able to return a status for it.
        const isCorrectConnector = Boolean(isBatch && batchConnectorId === connectorId)

        // Only check batches added within the last hour
        const oneHourAgo = Date.now() - ONE_HOUR_MS
        const isWithinLastHour = tx.addedTime >= oneHourAgo

        return isCorrectConnector && isWithinLastHour
      }

      return transactions.filter(shouldAttemptCheck)
    }

    return []
  }, [account.status, account.connector?.id, transactions])
}

/** Consecutive wallet_getCallsStatus errors before we fall back to checking the batch's tx on-chain */
const FAILURE_COUNT_THRESHOLD = 4
/**
 * Consecutive errors before giving up on a batch with no known tx hash (~30s at the 1s poll interval).
 * Failing it is a guess (it may well have landed), so a brief wallet RPC outage must not trigger it.
 */
const NO_HASH_FAILURE_COUNT_THRESHOLD = 30
/** The number of consecutive times wallet_getCallsStatus has failed for a given batch */
const FAILURE_COUNT_MAP: Record<string, number> = {}

async function fetchOnChainStatus(params: {
  hash?: string
  chainId: number
}): Promise<TransactionStatus.Success | TransactionStatus.Failed | undefined> {
  const { hash, chainId } = params
  // 0x + 32 bytes: a tx hash rather than an arbitrary hex batch id
  if (!hash || !isValidHexString(hash) || hash.length !== 66 || !isEVMChain(chainId)) {
    return undefined
  }
  try {
    const receipt = await getPublicClient(wagmiConfig, { chainId })?.getTransactionReceipt({ hash })
    if (!receipt) {
      return undefined
    }
    return receipt.status === 'success' ? TransactionStatus.Success : TransactionStatus.Failed
  } catch {
    // viem throws while the tx is unmined; an RPC outage also lands here and just means "no answer yet"
    return undefined
  }
}

function finalizeBatch(params: {
  hash?: string
  status: TransactionStatus.Failed | TransactionStatus.Success
  transaction: PendingBatchDetails
  onActivityUpdate: OnActivityUpdate
}) {
  const { transaction, onActivityUpdate, hash, status } = params
  onActivityUpdate({
    type: ActivityUpdateTransactionType.BaseTransaction,
    chainId: transaction.batchInfo.chainId,
    update: { ...transaction, status, hash },
    original: transaction,
  })
  delete FAILURE_COUNT_MAP[transaction.batchInfo.batchId]
}

// Receipts arrive in execution order; when a wallet executed the batch non-atomically (e.g. a separate
// approval tx before the main call), the last receipt is the main call's.
function selectBatchReceipt(result: GetCallsStatusResult): GetCallsStatusTransactionReceipt | undefined {
  const receipts = result.receipts ?? []
  if (result.atomic === false && receipts.length > 1) {
    return receipts[receipts.length - 1]
  }
  return receipts[0]
}

export async function pollPendingBatches(params: {
  provider: Web3Provider
  transactions: PendingBatchDetails[]
  onActivityUpdate: OnActivityUpdate
}): Promise<void> {
  const { provider, transactions, onActivityUpdate } = params
  for (const transaction of transactions) {
    try {
      const result = await getCallsStatus({ provider, batchId: transaction.batchInfo.batchId })

      const receipt = selectBatchReceipt(result)
      if (result.status === 200) {
        if (!receipt) {
          throw new Error(
            `${transaction.batchInfo.connectorId ?? 'wallet'} breaks eip5972 spec, returning a 200 status with no receipt`,
          )
        }

        const hash = receipt.transactionHash

        const updatedStatus = receipt.status === '0x1' ? TransactionStatus.Success : TransactionStatus.Failed
        finalizeBatch({ transaction, onActivityUpdate, hash, status: updatedStatus })
      }
      if (result.status >= 400) {
        // Per EIP-5792, statuses >= 400 are terminal (400 offchain failure, 500 revert, 600 partial revert):
        // finalize as failed, with the receipt hash when the wallet surfaces one, rather than re-polling.
        const hash = receipt?.transactionHash
        finalizeBatch({ transaction, onActivityUpdate, hash, status: TransactionStatus.Failed })
      }
      if (result.status >= 100 && result.status < 200) {
        // The wallet is answering, so only an unbroken run of errors counts toward giving up
        delete FAILURE_COUNT_MAP[transaction.batchInfo.batchId]
      }
    } catch (error) {
      const { batchId, chainId, connectorId } = transaction.batchInfo
      const failureCount = (FAILURE_COUNT_MAP[batchId] ?? 0) + 1
      FAILURE_COUNT_MAP[batchId] = failureCount
      if (failureCount < FAILURE_COUNT_THRESHOLD) {
        continue
      }

      // The wallet can't tell us, but the chain can when we have a tx hash: a CAIP-345 hash from
      // wallet_sendCalls, or a batch id that is itself the tx hash (only a guess, so it can still give up).
      const onChainStatus = await fetchOnChainStatus({ hash: transaction.hash, chainId })
      if (onChainStatus) {
        finalizeBatch({ transaction, onActivityUpdate, hash: transaction.hash, status: onChainStatus })
        continue
      }

      const hasKnownTxHash = transaction.hash !== batchId
      if (!hasKnownTxHash && failureCount >= NO_HASH_FAILURE_COUNT_THRESHOLD) {
        logger.error(error, { tags: { file: 'batch.ts', function: 'pollAllPendingBatches' }, extra: { connectorId } })
        finalizeBatch({ transaction, onActivityUpdate, status: TransactionStatus.Failed })
      }
    }
  }
}

export function usePollPendingBatchTransactions(onActivityUpdate: OnActivityUpdate) {
  const pendingBatchTransactions = usePendingBatches()
  const walletProvider = useEthersWeb3Provider()

  const pollAllPendingBatches = useEvent(async (provider: Web3Provider) =>
    pollPendingBatches({ provider, transactions: pendingBatchTransactions, onActivityUpdate }),
  )

  useEffect(() => {
    const interval =
      walletProvider && pendingBatchTransactions.length > 0
        ? setInterval(() => pollAllPendingBatches(walletProvider), 1_000)
        : undefined
    return () => clearInterval(interval)
  }, [pendingBatchTransactions, pollAllPendingBatches, walletProvider])
}

function getCallsStatus(params: { provider: Web3Provider; batchId: string }): Promise<GetCallsStatusResult> {
  const { provider, batchId } = params
  return provider.send('wallet_getCallsStatus', [batchId])
}
