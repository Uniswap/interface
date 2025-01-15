import { BigNumber, providers } from 'ethers'
import { useCallback, useMemo } from 'react'
import { TRANSACTION_CANCELLATION_GAS_FACTOR } from 'uniswap/src/constants/transactions'
import { FeeType } from 'uniswap/src/data/tradingApi/types'
import { useTransactionGasFee } from 'uniswap/src/features/gas/hooks'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { useAsyncData } from 'utilities/src/react/hooks'
import { FeeDetails, getAdjustedGasFeeDetails } from 'wallet/src/features/gas/adjustGasFee'
import { getCancelOrderTxRequest } from 'wallet/src/features/transactions/cancelTransactionSaga'

export type CancelationGasFeeDetails = {
  cancelRequest: providers.TransactionRequest
  cancelationGasFeeDisplayValue: string
}

/**
 * Construct cancelation transaction with increased gas (based on current network conditions),
 * then use it to compute new gas info.
 */
export function useCancelationGasFeeInfo(transaction: TransactionDetails): CancelationGasFeeDetails | undefined {
  const classicCancelRequest = useMemo(() => {
    return {
      chainId: transaction.chainId,
      from: transaction.from,
      to: transaction.from,
      value: '0x0',
    }
  }, [transaction])

  const isUniswapXTx = isUniswapX(transaction)

  const uniswapXCancelRequest = useUniswapXCancelRequest(transaction)
  const uniswapXGasFee = useTransactionGasFee(uniswapXCancelRequest?.data, !isUniswapXTx)

  const baseTxGasFee = useTransactionGasFee(classicCancelRequest, /* skip = */ isUniswapXTx)
  return useMemo(() => {
    if (isUniswapXTx) {
      if (!uniswapXCancelRequest.data || !uniswapXGasFee.value || !uniswapXGasFee.displayValue) {
        return undefined
      }
      return {
        cancelRequest: uniswapXCancelRequest.data,
        cancelationGasFeeDisplayValue: uniswapXGasFee.displayValue,
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

    const cancelationGasFeeDisplayValue = getCancellationGasFeeDisplayValue(
      adjustedFeeDetails,
      baseTxGasFee.params.gasLimit,
      baseTxGasFee.value,
      baseTxGasFee.displayValue,
    )

    return {
      cancelRequest,
      cancelationGasFeeDisplayValue,
    }
  }, [
    isUniswapXTx,
    baseTxGasFee.params,
    baseTxGasFee.value,
    baseTxGasFee.displayValue,
    classicCancelRequest,
    transaction,
    uniswapXCancelRequest.data,
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

function useUniswapXCancelRequest(transaction: TransactionDetails): {
  isLoading: boolean
  data: providers.TransactionRequest | undefined
  error?: Error
} {
  const cancelRequestFetcher = useCallback(() => {
    if (!isUniswapX(transaction)) {
      return undefined
    }
    return getCancelOrderTxRequest(transaction)
  }, [transaction])

  return useAsyncData(cancelRequestFetcher)
}
