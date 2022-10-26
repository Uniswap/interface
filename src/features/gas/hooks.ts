import { skipToken } from '@reduxjs/toolkit/dist/query'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { BigNumber, providers } from 'ethers'
import { useMemo } from 'react'
import { ChainId, isL2Chain } from 'src/constants/chains'
import { PollingInterval } from 'src/constants/misc'
import { TRANSACTION_CANCELLATION_GAS_FACTOR } from 'src/constants/transactions'
import { FeeDetails, getAdjustedGasFeeDetails } from 'src/features/gas/adjustGasFee'
import { useGasFeeQuery } from 'src/features/gas/api'
import { FeeType, GasSpeed, TransactionGasFeeInfo } from 'src/features/gas/types'
import { useUSDCValue } from 'src/features/routing/useUSDCPrice'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { TransactionDetails } from 'src/features/transactions/types'

export function useTransactionGasFee(
  tx: NullUndefined<providers.TransactionRequest>,
  speed: GasSpeed = GasSpeed.Urgent,
  skip?: boolean
): TransactionGasFeeInfo | undefined {
  // TODO: Handle error responses from gas endpoint
  const { data } = useGasFeeQuery((!skip && tx) || skipToken, {
    // poll new gas fees around every block time
    pollingInterval: isL2Chain(tx?.chainId)
      ? PollingInterval.LightningMcQueen
      : PollingInterval.Fast,
  })

  return useMemo(() => {
    if (!data) return undefined

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
      type: data.type,
      speed,
      gasFee: data.gasFee[speed],
      params,
    }
  }, [data, speed])
}

export function useUSDValue(chainId?: ChainId, ethValueInWei?: string) {
  const currencyAmount =
    ethValueInWei && chainId
      ? CurrencyAmount.fromRawAmount(NativeCurrency.onChain(chainId), ethValueInWei)
      : undefined

  return useUSDCValue(currencyAmount)?.toExact()
}

type CancelationGasFeeDetails = {
  cancelRequest: providers.TransactionRequest
  cancelationGasFee: string
}

/**
 * Construct cancelation transaction with increased gas (based on current network conditions),
 * then use it to compute new gas info.
 */
export function useCancelationGasFeeInfo(
  transaction: TransactionDetails
): CancelationGasFeeDetails | undefined {
  const cancelationRequest = useMemo(() => {
    return {
      chainId: transaction.chainId,
      from: transaction.from,
      to: transaction.from,
      value: '0x0',
    }
  }, [transaction])

  const baseTxGasFee = useTransactionGasFee(cancelationRequest, GasSpeed.Urgent)
  return useMemo(() => {
    if (!baseTxGasFee) return

    const adjustedFeeDetails = getAdjustedGasFeeDetails(
      transaction.options.request,
      baseTxGasFee,
      TRANSACTION_CANCELLATION_GAS_FACTOR
    )

    const cancelRequest = {
      ...cancelationRequest,
      ...adjustedFeeDetails.params,
      gasLimit: baseTxGasFee.params.gasLimit,
    }

    return {
      cancelRequest,
      cancelationGasFee: getCancelationGasFee(adjustedFeeDetails, baseTxGasFee.params.gasLimit),
    }
  }, [baseTxGasFee, cancelationRequest, transaction.options.request])
}

function getCancelationGasFee(adjustedFeeDetails: FeeDetails, gasLimit: string) {
  // doing object destructuring here loses ts checks based on FeeDetails.type >:(
  if (adjustedFeeDetails.type === FeeType.Legacy) {
    return BigNumber.from(gasLimit).mul(adjustedFeeDetails.params.gasPrice).toString()
  }

  return BigNumber.from(adjustedFeeDetails.params.maxFeePerGas).mul(gasLimit).toString()
}
