import { useCreateCancelTransactionRequest } from 'components/AccountDrawer/MiniPortfolio/Activity/utils'
import { GasFeeResult, GasSpeed, useTransactionGasFee } from 'hooks/useTransactionGasFee'
import { useMemo } from 'react'
import { UniswapXOrderDetails } from 'state/signatures/types'

export function useCancelLimitsGasEstimate(orders?: UniswapXOrderDetails[]): GasFeeResult {
  const cancelTransactionParams = useMemo(
    () =>
      orders && orders.length > 0
        ? {
            encodedOrders: orders.map((order) => order.encodedOrder as string),
            chainId: orders[0].chainId,
          }
        : undefined,
    [orders]
  )
  const cancelTransaction = useCreateCancelTransactionRequest(cancelTransactionParams)
  const gasEstimate = useTransactionGasFee(cancelTransaction, GasSpeed.Fast)
  return gasEstimate
}
