import { useQuery } from '@tanstack/react-query'
import { BigNumber, providers } from 'ethers'
import { useCallback, useMemo } from 'react'
import { TRANSACTION_CANCELLATION_GAS_FACTOR } from 'uniswap/src/constants/transactions'
import { FeeType } from 'uniswap/src/data/tradingApi/types'
import { CancellationGasFeeDetails, useTransactionGasFee } from 'uniswap/src/features/gas/hooks'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { FeeDetails, getAdjustedGasFeeDetails } from 'wallet/src/features/gas/adjustGasFee'
import { getCancelOrderTxRequest } from 'wallet/src/features/transactions/cancelTransactionSaga'

export const CANCELLATION_TX_VALUE = '0x0'

/**
 * Construct cancellation transaction with increased gas (based on current network conditions),
 * then use it to compute new gas info.
 */
export function useCancellationGasFeeInfo(transaction: TransactionDetails): CancellationGasFeeDetails | undefined {
  const classicCancelRequest = useMemo(() => {
    return {
      chainId: transaction.chainId,
      from: transaction.from,
      to: transaction.from,
      value: CANCELLATION_TX_VALUE,
    }
  }, [transaction])

  const isUniswapXTx = isUniswapX(transaction)

  const uniswapXCancelRequest = useUniswapXCancelRequest(transaction)
  const uniswapXGasFee = useTransactionGasFee(uniswapXCancelRequest, !isUniswapXTx)

  const baseTxGasFee = useTransactionGasFee(classicCancelRequest, /* skip = */ isUniswapXTx)
  return useMemo(() => {
    if (isUniswapXTx) {
      if (!uniswapXCancelRequest || !uniswapXGasFee.value || !uniswapXGasFee.displayValue) {
        return undefined
      }
      return {
        cancelRequest: uniswapXCancelRequest,
        gasFeeDisplayValue: uniswapXGasFee.displayValue,
      }
    }

    if (!baseTxGasFee.params || !baseTxGasFee.value || !baseTxGasFee.displayValue) {
      return undefined
    }

    let adjustedFeeDetails: FeeDetails | undefined
    try {
      adjustedFeeDetails = getAdjustedGasFeeDetails(
        transaction.options.request,
        baseTxGasFee.params,
        TRANSACTION_CANCELLATION_GAS_FACTOR,
      )
    } catch (error) {
      logger.error(error, {
        tags: { file: 'features/gas/hooks.ts', function: 'getAdjustedGasFeeDetails' },
        extra: { request: transaction.options.request, currentGasFeeParams: baseTxGasFee.params },
      })
      return undefined
    }

    const cancelRequest = {
      ...classicCancelRequest,
      ...adjustedFeeDetails.params,
      gasLimit: baseTxGasFee.params.gasLimit,
    }

    const gasFeeDisplayValue = getCancellationGasFeeDisplayValue(
      adjustedFeeDetails,
      baseTxGasFee.params.gasLimit,
      baseTxGasFee.value,
      baseTxGasFee.displayValue,
    )

    return {
      cancelRequest,
      gasFeeDisplayValue,
    }
  }, [
    isUniswapXTx,
    baseTxGasFee.params,
    baseTxGasFee.value,
    baseTxGasFee.displayValue,
    classicCancelRequest,
    transaction,
    uniswapXCancelRequest,
    uniswapXGasFee.value,
    uniswapXGasFee.displayValue,
  ])
}

function getCancellationGasFeeDisplayValue(
  adjustedFeeDetails: FeeDetails,
  gasLimit: string,
  previousValue: string,
  previousDisplayValue: string,
): string {
  // Use the original ratio of displayValue to value to maintain consistency with original gas fees
  return getCancelationGasFee(adjustedFeeDetails, gasLimit).mul(previousDisplayValue).div(previousValue).toString()
}

function getCancelationGasFee(adjustedFeeDetails: FeeDetails, gasLimit: string): BigNumber {
  // doing object destructuring here loses ts checks based on FeeDetails.type >:(
  if (adjustedFeeDetails.type === FeeType.LEGACY) {
    return BigNumber.from(gasLimit).mul(adjustedFeeDetails.params.gasPrice)
  }

  return BigNumber.from(adjustedFeeDetails.params.maxFeePerGas).mul(gasLimit)
}

function useUniswapXCancelRequest(transaction: TransactionDetails): providers.TransactionRequest | undefined {
  const cancelRequestFetcher = useCallback(async (): Promise<providers.TransactionRequest | null> => {
    if (!isUniswapX(transaction)) {
      return null
    }
    return getCancelOrderTxRequest(transaction)
  }, [transaction])

  const { data: cancelRequest } = useQuery({
    queryKey: [ReactQueryCacheKey.CancelUniswapXTransactionRequest, transaction.id],
    queryFn: cancelRequestFetcher,
  })
  return cancelRequest ?? undefined
}
