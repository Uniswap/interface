import { useWeb3React } from '@web3-react/core'
import { SupportedInterfaceChainId } from 'constants/chains'
import { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { useAppSelector } from 'state/hooks'
import { OFFCHAIN_ORDER_TYPE_TO_SIGNATURE_TYPE, OffchainOrderType } from 'state/routing/types'
import { UniswapXOrderStatus } from 'types/uniswapx'
import { addSignature } from './reducer'
import { SignatureDetails, SignatureType, UniswapXOrderDetails } from './types'

export function useAllSignatures(): { [id: string]: SignatureDetails } {
  const { account } = useWeb3React()
  const signatures = useAppSelector((state) => state.signatures) ?? {}
  if (!account || !signatures[account]) return {}
  return signatures[account]
}

export function usePendingOrders(): UniswapXOrderDetails[] {
  const signatures = useAllSignatures()
  return useMemo(() => {
    return Object.values(signatures).filter(isPendingOrder)
  }, [signatures])
}

export function useOrder(orderHash: string): UniswapXOrderDetails | undefined {
  const signatures = useAllSignatures()
  return useMemo(() => {
    const order = signatures[orderHash]
    if (
      !order ||
      ![SignatureType.SIGN_UNISWAPX_ORDER, SignatureType.SIGN_UNISWAPX_V2_ORDER, SignatureType.SIGN_LIMIT].includes(
        order.type as SignatureType
      )
    )
      return undefined
    return order
  }, [signatures, orderHash])
}

export function useAddOrder() {
  const dispatch = useDispatch()

  return useCallback(
    (
      offerer: string,
      orderHash: string,
      chainId: SupportedInterfaceChainId,
      expiry: number,
      swapInfo: UniswapXOrderDetails['swapInfo'],
      encodedOrder: string,
      offchainOrderType: OffchainOrderType
    ) => {
      dispatch(
        addSignature({
          type: OFFCHAIN_ORDER_TYPE_TO_SIGNATURE_TYPE[offchainOrderType],
          offerer,
          id: orderHash,
          chainId,
          expiry,
          orderHash,
          swapInfo,
          status: UniswapXOrderStatus.OPEN,
          addedTime: Date.now(),
          encodedOrder,
        })
      )
    },
    [dispatch]
  )
}

export function isFinalizedOrder(orderStatus: UniswapXOrderStatus) {
  return orderStatus !== UniswapXOrderStatus.OPEN && orderStatus !== UniswapXOrderStatus.PENDING_CANCELLATION
}

export function isOnChainOrder(orderStatus: UniswapXOrderStatus) {
  return orderStatus === UniswapXOrderStatus.FILLED
}

function isPendingOrder(signature: SignatureDetails): signature is UniswapXOrderDetails {
  return (
    (signature.type === SignatureType.SIGN_UNISWAPX_ORDER ||
      signature.type === SignatureType.SIGN_UNISWAPX_V2_ORDER ||
      signature.type === SignatureType.SIGN_LIMIT) &&
    [UniswapXOrderStatus.OPEN, UniswapXOrderStatus.PENDING_CANCELLATION].includes(signature.status)
  )
}
