import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { FeeType } from '@universe/api'
import { providers } from 'ethers/lib/ethers'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { BigNumberMax } from 'uniswap/src/utils/number'

export type FeeDetails =
  | { type: FeeType.LEGACY; params: { gasPrice: string } }
  | { type: FeeType.EIP1559; params: { maxFeePerGas: string; maxPriorityFeePerGas: string } }

/**
 * Returns gas prices params adjusted by provided factor.
 *
 * If the current gas param type doesn't match what was submitted on chain, transform the gas params to match.
 * Without this, cancelations would be blocked as no adjusted gas fee would be returned.
 *
 * This happens if gas service returns different gas param type than what ethers expects for the chain.
 */
export function getAdjustedGasFeeDetails({
  request,
  currentGasFeeParams,
  adjustmentFactor,
}: {
  request: providers.TransactionRequest
  currentGasFeeParams: NonNullable<GasFeeResult['params']>
  adjustmentFactor: number
}): FeeDetails {
  // Txn needs to be submitted with legacy gas params
  if (request.gasPrice) {
    const currentGasPrice =
      'gasPrice' in currentGasFeeParams ? currentGasFeeParams.gasPrice : currentGasFeeParams.maxFeePerGas

    return {
      type: FeeType.LEGACY,
      params: {
        gasPrice: multiplyByFactor({
          value: request.gasPrice,
          minValue: currentGasPrice,
          adjustmentFactor,
        }),
      },
    }
  }

  // Txn needs to be submitted with EIP-1559 params
  if (request.maxFeePerGas && request.maxPriorityFeePerGas) {
    const currentMaxFeePerGas =
      'maxFeePerGas' in currentGasFeeParams ? currentGasFeeParams.maxFeePerGas : currentGasFeeParams.gasPrice

    const currentMaxPriorityFeePerGas =
      'maxFeePerGas' in currentGasFeeParams ? currentGasFeeParams.maxPriorityFeePerGas : currentGasFeeParams.gasPrice

    return {
      type: FeeType.EIP1559,
      params: {
        maxFeePerGas: multiplyByFactor({
          value: request.maxFeePerGas,
          minValue: currentMaxFeePerGas,
          adjustmentFactor,
        }),
        maxPriorityFeePerGas: multiplyByFactor({
          value: request.maxPriorityFeePerGas,
          minValue: currentMaxPriorityFeePerGas,
          adjustmentFactor,
        }),
      },
    }
  }

  throw determineError(request, currentGasFeeParams)
}

function determineError(
  request: providers.TransactionRequest,
  currentGasFeeParams: NonNullable<GasFeeResult['params']>,
): Error {
  const isEIP1559Transaction = request.maxFeePerGas !== undefined && request.maxPriorityFeePerGas !== undefined

  const isEIP1559Params = 'maxFeePerGas' in currentGasFeeParams && 'maxPriorityFeePerGas' in currentGasFeeParams

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
      return new Error('Transaction is missing gas values, but gasParams were provided for an EIP-1559 transaction.')
    } else {
      return new Error(
        'Transaction is missing gas values, but currentGasFeeParams were provided for a legacy transaction.',
      )
    }
  }

  // Handling missing gas fee parameters
  const missingGasParams = !isEIP1559Params && !isLegacyParams
  if (missingGasParams) {
    if (isEIP1559Transaction) {
      return new Error(
        'currentGasFeeParams is missing gas fee parameters. Required: maxFeePerGas and maxPriorityFeePerGas for EIP-1559 transactions.',
      )
    } else {
      return new Error('currentGasFeeParams is missing gas fee parameters. Required: gasPrice for legacy transactions.')
    }
  }

  // Ensure the request and params are aligned for EIP-1559
  const EIP1559RequestMissingGasParams = isEIP1559Transaction && !isEIP1559Params
  if (EIP1559RequestMissingGasParams) {
    return new Error(
      'Transaction request specifies EIP-1559 gas values, but currentGasFeeParams lacks corresponding EIP-1559 parameters.',
    )
  }

  // Ensure the request and params are aligned for Legacy transactions
  const legacyRequestMissingGasParams = isLegacyTransaction && !isLegacyParams
  if (legacyRequestMissingGasParams) {
    return new Error(
      'Transaction request specifies Legacy gasPrice, but currentGasFeeParams lacks a corresponding gasPrice.',
    )
  }

  // The transaction does not match expected gas value patterns for Legacy or EIP-1559 transactions.
  // Ensure the transaction includes appropriate gas values (gasPrice for Legacy, maxFeePerGas and maxPriorityFeePerGas for 1559).'
  return new Error('Unable to determine gas fee structure.')
}

function multiplyByFactor({
  value,
  minValue,
  adjustmentFactor,
}: {
  value: BigNumberish
  minValue: BigNumberish | null
  adjustmentFactor: number
}): string {
  const baseValue = BigNumberMax(BigNumber.from(value), BigNumber.from(minValue ?? 0))
  return Math.floor(baseValue.toNumber() * adjustmentFactor).toString()
}
