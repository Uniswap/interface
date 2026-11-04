import { TradingApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { isValidHexString } from '@universe/encoding'
import ms from 'ms'
import { useCallback, useEffect, useMemo } from 'react'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { RetryOptions } from 'uniswap/src/features/chains/types'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { checkedTransaction } from 'uniswap/src/features/transactions/slice'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { toTradingApiSupportedChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import {
  LIQUIDITY_TRANSACTION_TYPES,
  TransactionNetworkFee,
  TransactionReceipt,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildNetworkFeeFromViemReceipt, receiptFromViemReceipt } from 'uniswap/src/features/transactions/utils/receipt'
import { shouldCheckTransaction } from 'uniswap/src/utils/polling'
import { usePublicClient } from 'wagmi'
import { useAccount } from '~/connection/hooks/useAccount'
import { useCurrentBlockTimestamp } from '~/connection/hooks/useCurrentBlockTimestamp'
import { useBlockNumber } from '~/lib/hooks/useBlockNumber'
import { CanceledError, RetryableError, retry } from '~/state/activity/polling/retry'
import { ActivityUpdateTransactionType, OnActivityUpdate } from '~/state/activity/types'
import { getRwaSwapAnalyticsFromTypeInfo } from '~/state/activity/utils'
import { useAppDispatch } from '~/state/hooks'
import { useMultichainTransactions, useTransactionRemover } from '~/state/transactions/hooks'
import { PendingTransactionDetails } from '~/state/transactions/types'
import { isPendingTx } from '~/state/transactions/utils'

interface ReceiptWithStatus {
  status: 'success' | 'reverted'
  receipt: TransactionReceipt
  /** Gas paid per the on-chain receipt; undefined when only the dummy fallback receipt is available */
  networkFee?: TransactionNetworkFee
  /** Resolved sponsor metadata from the /swaps `sponsorship` field, when the swap was gas-sponsored */
  sponsorInfo?: TradingApi.SponsorMetadata
}

function usePendingTransactions(chainId?: UniverseChainId): PendingTransactionDetails[] {
  const multichainTransactions = useMultichainTransactions()
  return useMemo(() => {
    if (!chainId) {
      return []
    }
    return multichainTransactions.flatMap(([tx, txChainId]) => {
      // Avoid polling for already-deposited bridge transactions, as they will be finalized by the bridge updater.
      // Also avoid polling UniswapX orders, as they are polled by usePollPendingOrders using the UniswapX backend API.
      if (isPendingTx(tx, /* skipDepositedBridgeTxs = */ true) && txChainId === chainId && !isUniswapX(tx)) {
        // Ignore batch txs which need to be polled against wallet instead of chain.
        return tx.batchInfo ? [] : [tx]
      }
      return []
    })
  }, [chainId, multichainTransactions])
}

const SWAP_STATUS_TO_FINALIZED_STATUS: Partial<Record<TradingApi.SwapStatus, 'success' | 'reverted'>> = {
  [TradingApi.SwapStatus.SUCCESS]: 'success',
  [TradingApi.SwapStatus.FAILED]: 'reverted',
  [TradingApi.SwapStatus.EXPIRED]: 'reverted',
}

/**
 * Resolves status from the on-chain receipt alone, bypassing the Trading API: its /swaps endpoint only
 * tracks hashes it quoted, so for a non-swap tx (e.g. an auction launch submitted via the generic swap
 * step) the lookup can spuriously report failure even though the receipt shows the tx landed.
 * Returns undefined while the tx is not yet mined.
 */
async function getOnChainReceiptStatus(
  tx: PendingTransactionDetails,
  publicClient: ReturnType<typeof usePublicClient>,
): Promise<ReceiptWithStatus | undefined> {
  if (!publicClient || !tx.hash || !isValidHexString(tx.hash)) {
    return undefined
  }

  const viemReceipt = await publicClient.getTransactionReceipt({ hash: tx.hash }).catch(() => undefined)
  const adaptedReceipt = receiptFromViemReceipt(viemReceipt)
  if (!viemReceipt || !adaptedReceipt) {
    return undefined
  }

  return {
    status: viemReceipt.status,
    receipt: adaptedReceipt,
    networkFee: buildNetworkFeeFromViemReceipt({ receipt: viemReceipt, chainId: tx.chainId }),
  }
}

export function usePollPendingTransactions(onActivityUpdate: OnActivityUpdate) {
  const account = useAccount()
  const publicClient = usePublicClient()

  const pendingTransactions = usePendingTransactions(account.chainId)
  const hasPending = pendingTransactions.length > 0
  const { blockTimestamp } = useCurrentBlockTimestamp({ refetchInterval: !hasPending ? false : undefined })

  const lastBlockNumber = useBlockNumber()
  const removeTransaction = useTransactionRemover()
  const dispatch = useAppDispatch()

  const getReceiptWithTradingApi = useCallback(
    (tx: PendingTransactionDetails): { promise: Promise<ReceiptWithStatus>; cancel: () => void } => {
      if (!account.chainId) {
        throw new Error('No chainId')
      }

      const pollingInterval = getChainInfo(account.chainId).tradingApiPollingIntervalMs
      const retryOptions: RetryOptions = {
        n: 20,
        minWait: pollingInterval,
        medWait: pollingInterval,
        maxWait: pollingInterval,
      }

      const removeIfStale = (): void => {
        if (!account.isConnected) {
          return
        }
        // Remove transactions past their deadline or - if there is no deadline - older than 6 hours.
        if (tx.deadline) {
          // Deadlines are expressed as seconds since epoch, as they are used on-chain.
          if (blockTimestamp && tx.deadline < Number(blockTimestamp)) {
            removeTransaction(tx.id)
          }
        } else if (tx.addedTime + ms(`6h`) < Date.now()) {
          removeTransaction(tx.id)
        }
      }

      // Auction launches and LP transactions (create/increase/decrease/migrate/collect) aren't
      // quoted by the Trading API, so /swaps never reports a terminal status for them — polling it
      // leaves them pending forever. The on-chain receipt is the only source of truth for their status.
      const isLiquidityTransaction =
        LIQUIDITY_TRANSACTION_TYPES.includes(tx.typeInfo.type) ||
        tx.typeInfo.type === TransactionType.LPIncentivesClaimRewards
      if (tx.typeInfo.type === TransactionType.AuctionLaunch || isLiquidityTransaction) {
        return retry(async () => {
          const receiptWithStatus = await getOnChainReceiptStatus(tx, publicClient)
          if (!receiptWithStatus) {
            removeIfStale()
            throw new RetryableError()
          }
          return receiptWithStatus
        }, retryOptions)
      }

      const chainId = toTradingApiSupportedChainId(account.chainId)
      if (!chainId) {
        throw new Error('No chainId')
      }

      return retry(() => {
        if (!tx.hash) {
          throw new Error(`Invalid transaction hash: hash not defined`)
        }
        return TradingApiClient.fetchSwaps({ txHashes: [tx.hash], chainId, swapper: account.address })
          .then(async (res) => {
            const swap = res.swaps?.[0]
            const status = swap?.status
            const finalizedStatus = status ? SWAP_STATUS_TO_FINALIZED_STATUS[status] : undefined
            const sponsorInfo = swap?.sponsorship

            if (!finalizedStatus) {
              removeIfStale()
              throw new RetryableError()
            }

            // Tracked UniswapX cancel txs are not swaps — mirror the isUniswapX order exclusion
            if (tx.typeInfo.type !== TransactionType.UniswapXCancel) {
              sendAnalyticsEvent(InterfaceEventName.SwapConfirmedOnClient, {
                time: Date.now() - tx.addedTime,
                swap_success: finalizedStatus === 'success',
                success: finalizedStatus === 'success',
                chainId: account.chainId,
                txHash: tx.hash ?? '',
                transactionType: tx.typeInfo.type,
                routing: 'classic',
                ...getRwaSwapAnalyticsFromTypeInfo(tx.typeInfo),
              })
            }

            let adaptedReceipt: TransactionReceipt | undefined
            let networkFee: TransactionNetworkFee | undefined

            if (publicClient && tx.hash && isValidHexString(tx.hash)) {
              try {
                const viemReceipt = await publicClient.getTransactionReceipt({ hash: tx.hash })
                adaptedReceipt = receiptFromViemReceipt(viemReceipt)
                if (!adaptedReceipt) {
                  throw new Error('Error converting viem receipt to transaction receipt')
                }
                networkFee = buildNetworkFeeFromViemReceipt({ receipt: viemReceipt, chainId: tx.chainId })
              } catch {
                // ignore errors and fallback to dummy
              }
            }

            if (!adaptedReceipt) {
              adaptedReceipt = {
                transactionIndex: 0,
                blockHash: tx.hash ?? '',
                blockNumber: 0,
                confirmedTime: Date.now(),
                gasUsed: 0,
                effectiveGasPrice: 0,
              }
            }

            return { status: finalizedStatus, receipt: adaptedReceipt, networkFee, sponsorInfo } as ReceiptWithStatus
          })
          .catch((_error) => {
            throw new RetryableError()
          })
      }, retryOptions) as { promise: Promise<ReceiptWithStatus>; cancel: () => void }
    },
    [account.chainId, account.address, account.isConnected, blockTimestamp, removeTransaction, publicClient],
  )

  useEffect(() => {
    if (!account.address || !account.chainId || !publicClient || !lastBlockNumber || !hasPending) {
      return undefined
    }

    const cancels = pendingTransactions
      .filter((tx) => shouldCheckTransaction(lastBlockNumber, tx))
      .map((tx) => {
        const { promise, cancel } = getReceiptWithTradingApi(tx)
        promise
          .then(({ status, receipt, networkFee, sponsorInfo }) => {
            if (!account.chainId) {
              return
            }
            onActivityUpdate({
              type: ActivityUpdateTransactionType.BaseTransaction,
              chainId: account.chainId,
              original: tx,
              update: {
                status: status === 'success' ? TransactionStatus.Success : TransactionStatus.Failed,
                typeInfo: tx.typeInfo,
                receipt,
                hash: tx.hash,
                networkFee: networkFee ?? tx.networkFee,
                sponsorInfo,
              },
            })
          })
          .catch((error) => {
            if (error instanceof CanceledError || !account.chainId) {
              return
            }
            dispatch(
              checkedTransaction({
                chainId: account.chainId!,
                id: tx.id,
                address: account.address!,
                blockNumber: lastBlockNumber,
              }),
            )
          })
        return cancel
      })

    return () => {
      cancels.forEach((cancel) => cancel())
    }
  }, [
    account.address,
    account.chainId,
    publicClient,
    lastBlockNumber,
    pendingTransactions,
    hasPending,
    dispatch,
    onActivityUpdate,
    getReceiptWithTradingApi,
  ])
}
