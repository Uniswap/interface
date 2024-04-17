import { RPC_PROVIDERS } from 'constants/providers'
import { useAssetActivitySubscription } from 'graphql/data/apollo/AssetActivityProvider'
import { useCallback, useEffect, useRef } from 'react'
import { toSerializableReceipt } from 'state/activity/utils'
import { usePendingOrders } from 'state/signatures/hooks'
import { OrderActivity, parseRemote as parseRemoteSignature } from 'state/signatures/parseRemote'
import { UniswapXOrderDetails } from 'state/signatures/types'
import { OnActivityUpdate, OrderUpdate } from './types'

export function useOnAssetActivity(onActivityUpdate: OnActivityUpdate) {
  const result = useAssetActivitySubscription()
  const activity = result.data?.onAssetActivity

  // Updates should only trigger from the AssetActivity subscription, so the pendingOrders are behind a ref.
  const pendingOrders = useRef<UniswapXOrderDetails[]>([])
  pendingOrders.current = usePendingOrders()

  const updateOrder = useCallback(
    async (activity: OrderActivity) => {
      const signature = parseRemoteSignature(activity as OrderActivity)
      const originalSignature = pendingOrders.current.find((order) => order.id === signature.id) ?? signature
      const receipt = signature.txHash
        ? toSerializableReceipt(await RPC_PROVIDERS[signature.chainId].getTransactionReceipt(signature.txHash))
        : undefined
      const update: OrderUpdate = {
        type: 'signature',
        updatedStatus: signature.status,
        originalSignature,
        chainId: signature.chainId,
        updatedSwapInfo: signature.swapInfo,
        receipt,
      }
      onActivityUpdate(update)
    },
    [onActivityUpdate]
  )

  useEffect(() => {
    if (activity?.details.__typename === 'SwapOrderDetails') {
      updateOrder(activity as OrderActivity)
    }
  }, [activity, updateOrder])
}
