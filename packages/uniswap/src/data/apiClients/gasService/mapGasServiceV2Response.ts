import type { EstimateGasFeeResponse } from '@uniswap/client-unirpc-v2/dist/uniswap/unirpc/v2/service_pb'
import { FeeType, type GasEstimate, type GasFeeResultWithoutState, type GasStrategy } from '@universe/api'
import { convertGasFeeToDisplayValue } from 'uniswap/src/features/gas/convertGasFeeToDisplayValue'
import { extractGasFeeParams } from 'uniswap/src/features/gas/utils'

export function mapGasServiceV2Response({
  response,
  gasStrategy,
}: {
  response: EstimateGasFeeResponse
  gasStrategy: GasStrategy
}): GasFeeResultWithoutState {
  const protoEstimate = response.gasEstimates[0]
  if (!protoEstimate) {
    throw new Error('Gas service v2: no gas estimate returned')
  }

  const { gasLimit, gasFee } = protoEstimate
  if (!gasLimit || !gasFee) {
    throw new Error('Gas service v2: missing gasLimit or gasFee in estimate')
  }

  // Proto GasStrategy doesn't include displayLimitInflationFactor (client-side only).
  // Required fields fall back to the client-side strategy if the server omits them.
  const strategy: GasStrategy = {
    limitInflationFactor: protoEstimate.strategy?.limitInflationFactor ?? gasStrategy.limitInflationFactor,
    displayLimitInflationFactor: gasStrategy.displayLimitInflationFactor,
    priceInflationFactor: protoEstimate.strategy?.priceInflationFactor ?? gasStrategy.priceInflationFactor,
    percentileThresholdFor1559Fee:
      protoEstimate.strategy?.percentileThresholdFor1559Fee ?? gasStrategy.percentileThresholdFor1559Fee,
    thresholdToInflateLastBlockBaseFee: protoEstimate.strategy?.thresholdToInflateLastBlockBaseFee,
    baseFeeMultiplier: protoEstimate.strategy?.baseFeeMultiplier,
    baseFeeHistoryWindow: protoEstimate.strategy?.baseFeeHistoryWindow,
    minPriorityFeeRatioOfBaseFee: protoEstimate.strategy?.minPriorityFeeRatioOfBaseFee,
    minPriorityFeeGwei: protoEstimate.strategy?.minPriorityFeeGwei,
    maxPriorityFeeGwei: protoEstimate.strategy?.maxPriorityFeeGwei,
  }

  let gasEstimate: GasEstimate

  if (protoEstimate.type === FeeType.LEGACY) {
    const { gasPrice } = protoEstimate
    if (!gasPrice) {
      throw new Error('Gas service v2: missing gasPrice in legacy estimate')
    }
    gasEstimate = { type: FeeType.LEGACY, strategy, gasLimit, gasFee, gasPrice }
  } else if (protoEstimate.type === FeeType.EIP1559) {
    const { maxFeePerGas, maxPriorityFeePerGas } = protoEstimate
    if (!maxFeePerGas || !maxPriorityFeePerGas) {
      throw new Error('Gas service v2: missing fee params in EIP-1559 estimate')
    }
    gasEstimate = { type: FeeType.EIP1559, strategy, gasLimit, gasFee, maxFeePerGas, maxPriorityFeePerGas }
  } else {
    throw new Error(`Gas service v2: unknown fee type '${protoEstimate.type}'`)
  }

  return {
    value: gasEstimate.gasFee,
    displayValue: convertGasFeeToDisplayValue({ gasFee: gasEstimate.gasFee, gasStrategy: strategy }),
    params: extractGasFeeParams(gasEstimate),
    gasEstimate,
  }
}
