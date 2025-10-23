import { Web3Provider } from '@ethersproject/providers'
import { useAccount } from 'hooks/useAccount'
import { useEthersWeb3Provider } from 'hooks/useEthersProvider'
import { useEffect, useMemo } from 'react'
import { ActivityUpdateTransactionType, OnActivityUpdate } from 'state/activity/types'
import { usePendingTransactions } from 'state/transactions/hooks'
import { PendingTransactionDetails } from 'state/transactions/types'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { HexString } from 'utilities/src/addresses/hex'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'

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
        return Boolean(isBatch && batchConnectorId === connectorId)
      }

      return transactions.filter(shouldAttemptCheck)
    }

    return []
  }, [account.status, account.connector?.id, transactions])
}

/** The number of times wallet_getCallsStatus has failed to respond / given a malformed response before we give up */
const FAILURE_COUNT_THRESHOLD = 4
/** The number of times wallet_getCallsStatus has returned a failure for a given batch */
const FAILURE_COUNT_MAP: Record<string, number> = {}

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

export function usePollPendingBatchTransactions(onActivityUpdate: OnActivityUpdate) {
  const pendingBatchTransactions = usePendingBatches()
  const walletProvider = useEthersWeb3Provider()

  const pollAllPendingBatches = useEvent(async (provider: Web3Provider) => {
    for (const transaction of pendingBatchTransactions) {
      try {
        const result = await getCallsStatus({ provider, batchId: transaction.batchInfo.batchId })

        const receipt = result.receipts?.[0]
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
          if (receipt) {
            const hash = receipt.transactionHash
            finalizeBatch({ transaction, onActivityUpdate, hash, status: TransactionStatus.Failed })
            return
          }
          throw new Error(
            `Failure status of ${result.status} received from ${transaction.batchInfo.connectorId ?? 'wallet'} with no receipt`,
          )
        }
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        FAILURE_COUNT_MAP[transaction.batchInfo.batchId] = (FAILURE_COUNT_MAP[transaction.batchInfo.batchId] ?? 0) + 1
        if (FAILURE_COUNT_MAP[transaction.batchInfo.batchId] >= FAILURE_COUNT_THRESHOLD) {
          const connectorId = transaction.batchInfo.connectorId
          logger.error(error, { tags: { file: 'batch.ts', function: 'pollAllPendingBatches' }, extra: { connectorId } })
          finalizeBatch({ transaction, onActivityUpdate, status: TransactionStatus.Failed })
        }
      }
    }
  })

  useEffect(() => {
    const interval =
      walletProvider && pendingBatchTransactions.length > 0
        ? setInterval(() => pollAllPendingBatches(walletProvider), 1_000)
        : undefined
    return () => clearInterval(interval)
  }, [pendingBatchTransactions, pollAllPendingBatches, walletProvider])
}

type GetCallsResult = {
  version: string
  id: HexString
  chainId: HexString
  status: number
  atomic: boolean
  receipts?: {
    logs: {
      address: HexString
      data: HexString
      topics: HexString[]
    }[]
    status: HexString
    blockHash: HexString
    blockNumber: HexString
    gasUsed: HexString
    transactionHash: HexString
  }[]
  capabilities?: Record<string, any>
}

function getCallsStatus(params: { provider: Web3Provider; batchId: string }): Promise<GetCallsResult> {
  const { provider, batchId } = params
  return provider.send('wallet_getCallsStatus', [batchId])
}
