import { BigNumber, providers } from 'ethers'
import { useCallback, useMemo } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { TRANSACTION_CANCELLATION_GAS_FACTOR } from 'uniswap/src/constants/transactions'
import { useGasFeeQuery } from 'uniswap/src/data/apiClients/uniswapApi/useGasFeeQuery'
import { FeeType, GasFeeResult, GasSpeed } from 'uniswap/src/features/gas/types'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { usePollingIntervalByChain } from 'uniswap/src/features/transactions/swap/hooks/usePollingIntervalByChain'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { WalletChainId } from 'uniswap/src/types/chains'
import { logger } from 'utilities/src/logger/logger'
import { useAsyncData } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { FeeDetails, getAdjustedGasFeeDetails } from 'wallet/src/features/gas/adjustGasFee'
import { getCancelOrderTxRequest } from 'wallet/src/features/transactions/cancelTransactionSaga'

export type CancelationGasFeeDetails = {
  cancelRequest: providers.TransactionRequest
  cancelationGasFee: string
}

export function useTransactionGasFee(
  tx: providers.TransactionRequest | undefined,
  speed: GasSpeed = GasSpeed.Urgent,
  skip?: boolean,
  refetchInterval?: PollingInterval,
): GasFeeResult {
  const pollingIntervalForChain = usePollingIntervalByChain(tx?.chainId)

  const { data, error, isLoading } = useGasFeeQuery({
    params: skip ? undefined : tx,
    refetchInterval,
    staleTime: pollingIntervalForChain,
    immediateGcTime: pollingIntervalForChain + 15 * ONE_SECOND_MS,
  })

  return useMemo(() => {
    if (!data) {
      return { error: error ?? null, isLoading }
    }

    const params =
      data.type === FeeType.Eip1559
        ? {
            maxPriorityFeePerGas: data.maxPriorityFeePerGas[speed],
            maxFeePerGas: data.maxFeePerGas[speed],
            gasLimit: data.gasLimit,
          }
        : {
            gasPrice: data.gasPrice[speed],
            gasLimit: data.gasLimit,
          }
    return {
      value: data.gasFee[speed],
      isLoading,
      error: error ?? null,
      params,
    }
  }, [data, error, isLoading, speed])
}

export function useUSDValue(chainId?: WalletChainId, ethValueInWei?: string): string | undefined {
  const currencyAmount = getCurrencyAmount({
    value: ethValueInWei,
    valueType: ValueType.Raw,
    currency: chainId ? NativeCurrency.onChain(chainId) : undefined,
  })

  return useUSDCValue(currencyAmount)?.toExact()
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
  const uniswapXGasFee = useTransactionGasFee(uniswapXCancelRequest?.data, GasSpeed.Urgent, !isUniswapXTx)

  const baseTxGasFee = useTransactionGasFee(classicCancelRequest, GasSpeed.Urgent, /* skip = */ isUniswapXTx)
  return useMemo(() => {
    if (isUniswapXTx) {
      if (!uniswapXCancelRequest.data || !uniswapXGasFee.value) {
        return
      }
      return { cancelRequest: uniswapXCancelRequest.data, cancelationGasFee: uniswapXGasFee.value }
    }

    if (!baseTxGasFee.params) {
      return
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
      return
    }

    const cancelRequest = {
      ...classicCancelRequest,
      ...adjustedFeeDetails.params,
      gasLimit: baseTxGasFee.params.gasLimit,
    }

    return {
      cancelRequest,
      cancelationGasFee: getCancelationGasFee(adjustedFeeDetails, baseTxGasFee.params.gasLimit),
    }
  }, [
    isUniswapXTx,
    baseTxGasFee.params,
    classicCancelRequest,
    transaction,
    uniswapXCancelRequest.data,
    uniswapXGasFee.value,
  ])
}

function getCancelationGasFee(adjustedFeeDetails: FeeDetails, gasLimit: string): string {
  // doing object destructuring here loses ts checks based on FeeDetails.type >:(
  if (adjustedFeeDetails.type === FeeType.Legacy) {
    return BigNumber.from(gasLimit).mul(adjustedFeeDetails.params.gasPrice).toString()
  }

  return BigNumber.from(adjustedFeeDetails.params.maxFeePerGas).mul(gasLimit).toString()
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
