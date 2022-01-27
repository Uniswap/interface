import { BigNumber, BigNumberish, providers } from 'ethers'
import { BigNumberMax } from 'src/utils/number'

// Returns gas prices params adjusted by provided factor
export function getAdjustedGasFeeParams(
  request: providers.TransactionRequest,
  currentFeeData: providers.FeeData,
  adjustmentFactor: number
) {
  if (request.gasPrice) {
    return {
      gasPrice: multiplyByFactor(request.gasPrice, currentFeeData.gasPrice, adjustmentFactor),
    }
  } else if (request.maxFeePerGas && request.maxPriorityFeePerGas) {
    return {
      maxFeePerGas: multiplyByFactor(
        request.maxFeePerGas,
        currentFeeData.maxFeePerGas,
        adjustmentFactor
      ),
      maxPriorityFeePerGas: multiplyByFactor(
        request.maxPriorityFeePerGas,
        currentFeeData.maxPriorityFeePerGas,
        adjustmentFactor
      ),
    }
  } else {
    throw new Error('Transaction request has no gas values')
  }
}

function multiplyByFactor(
  value: BigNumberish,
  minValue: BigNumberish | null,
  adjustmentFactor: number
) {
  const baseValue = BigNumberMax(BigNumber.from(value), BigNumber.from(minValue ?? 0))
  return Math.floor(baseValue.toNumber() * adjustmentFactor).toString()
}
