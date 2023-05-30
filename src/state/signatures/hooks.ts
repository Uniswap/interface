import { useWeb3React } from '@web3-react/core'
import { SupportedChainId } from 'constants/chains'
import { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { useAppSelector } from 'state/hooks'

import { addTransaction } from '../transactions/reducer'
import { createFakeGoudaOrders } from './dummy_data'
import { addSignature, updateSignature } from './reducer'
import { DutchLimitOrderStatus, SignatureDetails, SignatureType, UniswapXOrderDetails } from './types'

function isPendingOrder(signature: SignatureDetails): signature is UniswapXOrderDetails {
  return signature.type === SignatureType.SIGN_UNISWAPX_ORDER && signature.status === DutchLimitOrderStatus.OPEN
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function usePendingOrders(): UniswapXOrderDetails[] {
  const { account } = useWeb3React()
  const signatures = useAppSelector((state) => state.signatures)

  return useMemo(() => {
    if (!account || !signatures[account]) return []
    return Object.values(signatures[account]).filter(isPendingOrder)
  }, [signatures, account])
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useAddOrder() {
  const dispatch = useDispatch()

  return useCallback(
    (
      offerer: string,
      orderHash: string,
      chainId: SupportedChainId,
      expiry: number,
      swapInfo: UniswapXOrderDetails['swapInfo']
    ) => {
      dispatch(
        addSignature({
          type: SignatureType.SIGN_UNISWAPX_ORDER,
          offerer,
          id: orderHash,
          chainId,
          expiry,
          orderHash,
          swapInfo,
          status: DutchLimitOrderStatus.OPEN,
          addedTime: Date.now(),
        })
      )
    },
    [dispatch]
  )
}

export function isOnChainOrder(orderStatus: DutchLimitOrderStatus) {
  return orderStatus === DutchLimitOrderStatus.FILLED || orderStatus === DutchLimitOrderStatus.CANCELLED
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useUpdateOrder() {
  const dispatch = useDispatch()

  return useCallback(
    (order: UniswapXOrderDetails, status: DutchLimitOrderStatus, txHash?: string) => {
      if (txHash && isOnChainOrder(status)) {
        // Creates an entry for the transaction which resulted from the order
        dispatch(addTransaction({ chainId: order.chainId, from: order.offerer, hash: txHash, info: order.swapInfo }))
      }
      dispatch(updateSignature({ ...order, status, txHash }))
    },
    [dispatch]
  )
}

export function useAllSignatures(): { [id: string]: SignatureDetails } {
  const { account } = useWeb3React()

  // TODO: Return signatures from redux store once we have a way to add them
  const signatures = /* useAppSelector((state) => state.signatures[account]) ?? {} */ createFakeGoudaOrders(
    account ?? ''
  )

  if (!account || !signatures[account]) return {}

  return signatures[account]
}
