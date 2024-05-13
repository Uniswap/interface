import { ChainId, TradeType } from '@uniswap/sdk-core'
import { SupportedInterfaceChainId } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import { useAssetActivitySubscription } from 'graphql/data/apollo/AssetActivityProvider'
import { supportedChainIdFromGQLChain } from 'graphql/data/util'
import { useCallback, useEffect, useRef } from 'react'
import { toSerializableReceipt } from 'state/activity/utils'
import { usePendingOrders } from 'state/signatures/hooks'
import { parseRemote as parseRemoteOrder } from 'state/signatures/parseRemote'
import { OrderActivity, UniswapXOrderDetails } from 'state/signatures/types'
import { useMultichainTransactions } from 'state/transactions/hooks'
import {
  SerializableTransactionReceipt,
  TransactionActivity,
  TransactionDetails,
  TransactionInfo,
  TransactionType,
} from 'state/transactions/types'
import {
  AssetActivityPartsFragment,
  TokenTransfer,
  TransactionDirection,
  TransactionStatus,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { OnActivityUpdate, TransactionUpdate } from './types'

export function useOnAssetActivity(onActivityUpdate: OnActivityUpdate) {
  const onOrderActivity = useOnOrderActivity(onActivityUpdate)
  const onTransactionActivity = useOnTransactionActivity(onActivityUpdate)
  const onActivity = useCallback(
    (activity?: AssetActivityPartsFragment) => {
      if (activity?.details.__typename === 'SwapOrderDetails') {
        onOrderActivity(activity as OrderActivity)
      } else if (activity?.details.__typename === 'TransactionDetails') {
        onTransactionActivity(activity as TransactionActivity)
      }
    },
    [onOrderActivity, onTransactionActivity]
  )

  const result = useAssetActivitySubscription()
  const activity = result.data?.onAssetActivity
  useEffect(() => onActivity(activity), [activity, onActivity])
}

async function getReceipt(chainId: SupportedInterfaceChainId, hash: string): Promise<SerializableTransactionReceipt>
async function getReceipt(
  chainId: SupportedInterfaceChainId,
  hash?: string
): Promise<SerializableTransactionReceipt | undefined>
async function getReceipt(chainId: SupportedInterfaceChainId, hash?: string) {
  if (!hash) return undefined
  return toSerializableReceipt(await RPC_PROVIDERS[chainId].getTransactionReceipt(hash))
}

function useOnOrderActivity(onActivityUpdate: OnActivityUpdate) {
  // Updates should only trigger from the AssetActivity subscription, so the pending orders are behind a ref.
  const pendingOrders = useRef<UniswapXOrderDetails[]>([])
  pendingOrders.current = usePendingOrders()

  return useCallback(
    async (activity: OrderActivity) => {
      const updatedOrder = parseRemoteOrder(activity)
      const pendingOrder = pendingOrders.current.find((order) => order.id === updatedOrder.id) ?? updatedOrder
      onActivityUpdate({
        type: 'signature',
        chainId: updatedOrder.chainId,
        original: pendingOrder,
        update: updatedOrder,
        receipt: await getReceipt(updatedOrder.chainId, updatedOrder.txHash),
      })
    },
    [onActivityUpdate]
  )
}

function useOnTransactionActivity(onActivityUpdate: OnActivityUpdate) {
  // Updates should only trigger from the AssetActivity subscription, so the pending transactions are behind a ref.
  const pendingTransactions = useRef<[TransactionDetails, ChainId][]>()
  pendingTransactions.current = useMultichainTransactions()

  return useCallback(
    async (activity: TransactionActivity) => {
      const chainId = supportedChainIdFromGQLChain(activity.chain)
      if (activity.details.status !== TransactionStatus.Confirmed || !chainId) return

      const pendingTransaction = pendingTransactions.current?.find(
        ([tx, txChainId]) => tx.hash === activity.details.hash && txChainId === chainId
      )?.[0]
      // TODO(WEB-4007): Add transactions which were submitted from a different client (and are not already tracked).
      if (!pendingTransaction) return

      const updatedTransaction: TransactionUpdate['update'] & { info: TransactionInfo } = {
        info: { ...pendingTransaction.info },
      }
      if (updatedTransaction.info.type === TransactionType.SWAP) {
        if (updatedTransaction.info.tradeType === TradeType.EXACT_INPUT) {
          const change = activity.details.assetChanges.find(
            (change) => change?.__typename === 'TokenTransfer' && change?.direction === TransactionDirection.Out
          ) as TokenTransfer
          if (change.asset.decimals && change.quantity) {
            // The quantity is returned as a decimal string, but the state expects a BigInt-compatible string.
            const amountRaw = (change.asset.decimals * parseFloat(change.quantity)).toFixed(0)
            updatedTransaction.info.settledOutputCurrencyAmountRaw = amountRaw
          }
        } else if (updatedTransaction.info.tradeType === TradeType.EXACT_OUTPUT) {
          // TODO(WEB-3962): Handle settled EXACT_OUTPUT amounts
        }
      }

      onActivityUpdate({
        type: 'transaction',
        chainId,
        original: pendingTransaction,
        update: updatedTransaction,
        receipt: await getReceipt(chainId, pendingTransaction.hash),
      })
    },
    [onActivityUpdate]
  )
}
