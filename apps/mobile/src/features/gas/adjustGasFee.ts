import { BigNumber, BigNumberish, providers } from 'ethers'
import { BigNumberMax } from 'src/utils/number'
import {
  FeeType,
  TransactionEip1559FeeParams,
  TransactionGasFeeInfo,
  TransactionLegacyFeeParams,
} from 'wallet/src/features/gas/types'

export type FeeDetails =
  | { type: FeeType.Legacy; params: { gasPrice: string } }
  | { type: FeeType.Eip1559; params: { maxFeePerGas: string; maxPriorityFeePerGas: string } }
// Returns gas prices params adjusted by provided factor
export function getAdjustedGasFeeDetails(
  request: providers.TransactionRequest,
  currentGasFeeInfo: TransactionGasFeeInfo,
  adjustmentFactor: number
): FeeDetails {
  if (request.gasPrice) {
    return {
      type: FeeType.Legacy,
      params: {
        gasPrice: multiplyByFactor(
          request.gasPrice,
          (currentGasFeeInfo.params as TransactionLegacyFeeParams).gasPrice,
          adjustmentFactor
        ),
      },
    }
  } else if (request.maxFeePerGas && request.maxPriorityFeePerGas) {
    const feeParams = currentGasFeeInfo.params as TransactionEip1559FeeParams
    return {
      type: FeeType.Eip1559,
      params: {
        maxFeePerGas: multiplyByFactor(
          request.maxFeePerGas,
          feeParams.maxFeePerGas,
          adjustmentFactor
        ),
        maxPriorityFeePerGas: multiplyByFactor(
          request.maxPriorityFeePerGas,
          feeParams.maxPriorityFeePerGas,
          adjustmentFactor
        ),
      },
    }
  } else {
    throw new Error('Transaction request has no gas values')
  }
}

function multiplyByFactor(
  value: BigNumberish,
  minValue: BigNumberish | null,
  adjustmentFactor: number
): string {
  const baseValue = BigNumberMax(BigNumber.from(value), BigNumber.from(minValue ?? 0))
  return Math.floor(baseValue.toNumber() * adjustmentFactor).toString()
}
