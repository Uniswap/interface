import { useWeb3React } from '@web3-react/core'
import { RouteResponse, UpdatedGenieAsset } from 'nft/types'
import { useCallback } from 'react'
import { shallow } from 'zustand/shallow'

import { useBag } from './useBag'
import { useSendTransaction } from './useSendTransaction'
import { useTransactionResponse } from './useTransactionResponse'

export function usePurchaseAssets(): ({
  routingData,
  assetsToBuy,
  purchasingWithErc20,
  doNotResetBag,
}: {
  routingData: RouteResponse
  assetsToBuy: UpdatedGenieAsset[]
  purchasingWithErc20?: boolean
  doNotResetBag?: boolean
}) => Promise<void> {
  const { provider } = useWeb3React()
  const sendTransaction = useSendTransaction((state) => state.sendTransaction)
  const setTransactionResponse = useTransactionResponse((state) => state.setTransactionResponse)

  const {
    setLocked: setBagLocked,
    setBagExpanded,
    reset: resetBag,
  } = useBag(
    ({ setLocked, setBagExpanded, reset }) => ({
      setLocked,
      setBagExpanded,
      reset,
    }),
    shallow
  )

  return useCallback(
    async ({
      routingData,
      assetsToBuy,
      purchasingWithErc20 = false,
      doNotResetBag = false,
    }: {
      routingData: RouteResponse
      assetsToBuy: UpdatedGenieAsset[]
      purchasingWithErc20?: boolean
      doNotResetBag?: boolean
    }) => {
      if (!provider) return

      const purchaseResponse = await sendTransaction(
        provider.getSigner(),
        assetsToBuy,
        routingData,
        purchasingWithErc20
      )

      if (purchaseResponse) {
        setBagLocked(false)
        setTransactionResponse(purchaseResponse)
        setBagExpanded({ bagExpanded: false })
        if (!doNotResetBag) {
          resetBag()
        }
      }
    },
    [provider, resetBag, sendTransaction, setBagExpanded, setBagLocked, setTransactionResponse]
  )
}
