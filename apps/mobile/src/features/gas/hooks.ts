import { CurrencyAmount } from '@uniswap/sdk-core'
import { BigNumber, providers } from 'ethers'
import { useMemo } from 'react'
import { TRANSACTION_CANCELLATION_GAS_FACTOR } from 'src/constants/transactions'
import { FeeDetails, getAdjustedGasFeeDetails } from 'src/features/gas/adjustGasFee'
import { useUSDCValue } from 'src/features/routing/useUSDCPrice'
import { TransactionDetails } from 'src/features/transactions/types'
import { ChainId } from 'wallet/src/constants/chains'
import { useTransactionGasFee } from 'wallet/src/features/gas/hooks'
import { FeeType, GasSpeed } from 'wallet/src/features/gas/types'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'

export function useUSDValue(chainId?: ChainId, ethValueInWei?: string): string | undefined {
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

function getCancelationGasFee(adjustedFeeDetails: FeeDetails, gasLimit: string): string {
  // doing object destructuring here loses ts checks based on FeeDetails.type >:(
  if (adjustedFeeDetails.type === FeeType.Legacy) {
    return BigNumber.from(gasLimit).mul(adjustedFeeDetails.params.gasPrice).toString()
  }

  return BigNumber.from(adjustedFeeDetails.params.maxFeePerGas).mul(gasLimit).toString()
}
