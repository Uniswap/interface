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

  throw new Error('Transaction request has no gas values')
}

function multiplyByFactor(
  value: BigNumberish,
  minValue: BigNumberish | null,
  adjustmentFactor: number
): string {
  const baseValue = BigNumberMax(BigNumber.from(value), BigNumber.from(minValue ?? 0))
  return Math.floor(baseValue.toNumber() * adjustmentFactor).toString()
}
