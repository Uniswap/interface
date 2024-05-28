import { RouteResponse, UpdatedGenieAsset } from 'nft/types'
import { useCallback } from 'react'

import { useEthersSigner } from 'hooks/useEthersSigner'
import { useBag } from './useBag'
import { useSendTransaction } from './useSendTransaction'
import { useTransactionResponse } from './useTransactionResponse'

export function usePurchaseAssets(): (
  routingData: RouteResponse,
  assetsToBuy: UpdatedGenieAsset[],
  purchasingWithErc20?: boolean
) => Promise<void> {
  const signer = useEthersSigner()
  const sendTransaction = useSendTransaction((state) => state.sendTransaction)
  const setTransactionResponse = useTransactionResponse((state) => state.setTransactionResponse)

  const {
    setLocked: setBagLocked,
    setBagExpanded,
    reset: resetBag,
  } = useBag(({ setLocked, setBagExpanded, reset }) => ({
    setLocked,
    setBagExpanded,
    reset,
  }))

  return useCallback(
    async (routingData: RouteResponse, assetsToBuy: UpdatedGenieAsset[], purchasingWithErc20 = false) => {
      if (!signer) return

      const purchaseResponse = await sendTransaction(signer, assetsToBuy, routingData, purchasingWithErc20)

      if (purchaseResponse) {
        setBagLocked(false)
        setTransactionResponse(purchaseResponse)
        setBagExpanded({ bagExpanded: false })
        resetBag()
      }
    },
    [signer, resetBag, sendTransaction, setBagExpanded, setBagLocked, setTransactionResponse]
  )
}
