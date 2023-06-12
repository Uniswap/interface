import { useWeb3React } from '@web3-react/core'
import { SupportedChainId } from 'constants/chains'
import { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { useAppSelector } from 'state/hooks'

import { addTransaction } from '../transactions/reducer'
import { addSignature, updateSignature } from './reducer'
import { DutchLimitOrderStatus, SignatureDetails, SignatureType, UniswapXOrderDetails } from './types'

function isPendingOrder(signature: SignatureDetails): signature is UniswapXOrderDetails {
  return signature.type === SignatureType.SIGN_UNISWAPX_ORDER && signature.status === DutchLimitOrderStatus.OPEN
}

export function usePendingOrders(): UniswapXOrderDetails[] {
  const { account } = useWeb3React()
  const signatures = useAppSelector((state) => state.signatures)

  return useMemo(() => {
    if (!account || !signatures[account]) return []
    return Object.values(signatures[account]).filter(isPendingOrder)
  }, [signatures, account])
}

export function useOrder(orderHash: string): UniswapXOrderDetails | undefined {
  const { account } = useWeb3React()
  const signatures = useAppSelector((state) => state.signatures)

  return useMemo(() => {
    if (!account || !signatures[account]) return undefined
    const order = signatures[account][orderHash]
    if (!order || order.type !== SignatureType.SIGN_UNISWAPX_ORDER) return undefined
    return order
  }, [account, signatures, orderHash])
}

export function useAddOrder() {
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

export function isFinalizedOrder(orderStatus: DutchLimitOrderStatus) {
  return orderStatus !== DutchLimitOrderStatus.OPEN
}

export function isOnChainOrder(orderStatus: DutchLimitOrderStatus) {
  return orderStatus === DutchLimitOrderStatus.FILLED || orderStatus === DutchLimitOrderStatus.CANCELLED
}

export function useUpdateOrder() {
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

  const signatures = useAppSelector((state) => state.signatures) ?? {}

  if (!account || !signatures[account]) return {}

  return signatures[account]
}
