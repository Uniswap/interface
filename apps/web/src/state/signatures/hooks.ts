import { useAccount } from 'hooks/useAccount'
import { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { useAppSelector } from 'state/hooks'
import { OffchainOrderType } from 'state/routing/types'
import { addSignature } from 'state/signatures/reducer'
import {
  OFFCHAIN_ORDER_TYPE_TO_SIGNATURE_TYPE,
  SignatureDetails,
  SignatureType,
  UniswapXOrderDetails,
} from 'state/signatures/types'
import { UniswapXOrderStatus } from 'types/uniswapx'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export function useAllSignatures(): { [id: string]: SignatureDetails } {
  const account = useAccount()
  const signatures = useAppSelector((state) => state.signatures) ?? {}
  if (!account.address || !signatures[account.address]) {
    return {}
  }
  return signatures[account.address]
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
      ![
        SignatureType.SIGN_UNISWAPX_ORDER,
        SignatureType.SIGN_UNISWAPX_V2_ORDER,
        SignatureType.SIGN_UNISWAPX_V3_ORDER,
        SignatureType.SIGN_LIMIT,
        SignatureType.SIGN_PRIORITY_ORDER,
      ].includes(order.type as SignatureType)
    ) {
      return undefined
    }
    return order
  }, [signatures, orderHash])
}

export function useAddOrder() {
  const dispatch = useDispatch()

  return useCallback(
    (
      offerer: string,
      orderHash: string,
      chainId: UniverseChainId,
      expiry: number,
      swapInfo: UniswapXOrderDetails['swapInfo'],
      encodedOrder: string,
      offchainOrderType: OffchainOrderType,
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
        }),
      )
    },
    [dispatch],
  )
}

export function isFinalizedOrder(order: UniswapXOrderDetails) {
  if (order.type === SignatureType.SIGN_LIMIT) {
    return ![
      UniswapXOrderStatus.OPEN,
      UniswapXOrderStatus.PENDING_CANCELLATION,
      UniswapXOrderStatus.INSUFFICIENT_FUNDS,
    ].includes(order.status)
  } else {
    return ![UniswapXOrderStatus.OPEN, UniswapXOrderStatus.PENDING_CANCELLATION].includes(order.status)
  }
}

export function isOnChainOrder(orderStatus: UniswapXOrderStatus) {
  return orderStatus === UniswapXOrderStatus.FILLED
}

function isPendingOrder(signature: SignatureDetails): signature is UniswapXOrderDetails {
  if (signature.type === SignatureType.SIGN_LIMIT) {
    return [
      UniswapXOrderStatus.OPEN,
      UniswapXOrderStatus.PENDING_CANCELLATION,
      UniswapXOrderStatus.INSUFFICIENT_FUNDS,
    ].includes(signature.status)
  } else if (
    signature.type === SignatureType.SIGN_UNISWAPX_ORDER ||
    signature.type === SignatureType.SIGN_UNISWAPX_V2_ORDER ||
    signature.type === SignatureType.SIGN_UNISWAPX_V3_ORDER ||
    signature.type === SignatureType.SIGN_PRIORITY_ORDER
  ) {
    return [
      UniswapXOrderStatus.OPEN,
      UniswapXOrderStatus.PENDING_CANCELLATION,
      UniswapXOrderStatus.INSUFFICIENT_FUNDS,
    ].includes(signature.status)
  }
  return false
}
