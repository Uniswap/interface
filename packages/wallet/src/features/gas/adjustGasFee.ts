import { BigNumber, BigNumberish, providers } from 'ethers'
import { FeeType, GasFeeResult } from 'wallet/src/features/gas/types'
import { BigNumberMax } from 'wallet/src/utils/number'

export type FeeDetails =
  | { type: FeeType.Legacy; params: { gasPrice: string } }
  | { type: FeeType.Eip1559; params: { maxFeePerGas: string; maxPriorityFeePerGas: string } }
// Returns gas prices params adjusted by provided factor
export function getAdjustedGasFeeDetails(
  request: providers.TransactionRequest,
  currentGasFeeParams: NonNullable<GasFeeResult['params']>,
  adjustmentFactor: number
): FeeDetails {
  // Legacy
  if (request.gasPrice && 'gasPrice' in currentGasFeeParams) {
    return {
      type: FeeType.Legacy,
      params: {
        gasPrice: multiplyByFactor(
          request.gasPrice,
          currentGasFeeParams.gasPrice,
          adjustmentFactor
        ),
      },
    }
  }

  // EIP-1559
  if (
    request.maxFeePerGas &&
    request.maxPriorityFeePerGas &&
    'maxFeePerGas' in currentGasFeeParams
  ) {
    return {
      type: FeeType.Eip1559,
      params: {
        maxFeePerGas: multiplyByFactor(
          request.maxFeePerGas,
          currentGasFeeParams.maxFeePerGas,
          adjustmentFactor
        ),
        maxPriorityFeePerGas: multiplyByFactor(
          request.maxPriorityFeePerGas,
          currentGasFeeParams.maxPriorityFeePerGas,
          adjustmentFactor
        ),
      },
    }
  }

  throw determineError(request, currentGasFeeParams)
}

function determineError(
  request: providers.TransactionRequest,
  currentGasFeeParams: NonNullable<GasFeeResult['params']>
): Error {
  const isEIP1559Transaction =
    request.maxFeePerGas !== undefined && request.maxPriorityFeePerGas !== undefined
  const isEIP1559Params =
    'maxFeePerGas' in currentGasFeeParams && 'maxPriorityFeePerGas' in currentGasFeeParams
  const isLegacyTransaction = request.gasPrice !== undefined
  const isLegacyParams = 'gasPrice' in currentGasFeeParams

  // General error if all detection flags are false
  if (!isEIP1559Transaction && !isLegacyTransaction && !isEIP1559Params && !isLegacyParams) {
    return new Error('Unable to determine gas fee structure. No gas values or parameters found.')
  }

  // Handle missing gas values on transaction
  const transactionMissingGasInfo = !isEIP1559Transaction && !isLegacyTransaction
  if (transactionMissingGasInfo) {
    if (isEIP1559Params) {
      return new Error(
        'Transaction is missing gas values, but gasParams were provided for an EIP-1559 transaction.'
      )
    } else {
      return new Error(
        'Transaction is missing gas values, but currentGasFeeParams were provided for a legacy transaction.'
      )
    }
  }

  // Handling missing gas fee parameters
  const missingGasParams = !isEIP1559Params && !isLegacyParams
  if (missingGasParams) {
    if (isEIP1559Transaction) {
      return new Error(
        'currentGasFeeParams is missing gas fee parameters. Required: maxFeePerGas and maxPriorityFeePerGas for EIP-1559 transactions.'
      )
    } else {
      return new Error(
        'currentGasFeeParams is missing gas fee parameters. Required: gasPrice for legacy transactions.'
      )
    }
  }

  // Ensure the request and params are aligned for EIP-1559
  const EIP1559RequestMissingGasParams = isEIP1559Transaction && !isEIP1559Params
  if (EIP1559RequestMissingGasParams) {
    return new Error(
      'Transaction request specifies EIP-1559 gas values, but currentGasFeeParams lacks corresponding EIP-1559 parameters.'
    )
  }

  // Ensure the request and params are aligned for Legacy transactions
  const legacyRequestMissingGasParams = isLegacyTransaction && !isLegacyParams
  if (legacyRequestMissingGasParams) {
    return new Error(
      'Transaction request specifies Legacy gasPrice, but currentGasFeeParams lacks a corresponding gasPrice.'
    )
  }

  // The transaction does not match expected gas value patterns for Legacy or EIP-1559 transactions.
  // Ensure the transaction includes appropriate gas values (gasPrice for Legacy, maxFeePerGas and maxPriorityFeePerGas for 1559).'
  return new Error('Unable to determine gas fee structure.')
}

function multiplyByFactor(
  value: BigNumberish,
  minValue: BigNumberish | null,
  adjustmentFactor: number
): string {
  const baseValue = BigNumberMax(BigNumber.from(value), BigNumber.from(minValue ?? 0))
  return Math.floor(baseValue.toNumber() * adjustmentFactor).toString()
}
