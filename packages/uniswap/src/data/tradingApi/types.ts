// These types are used in the gas estimation improvement experiment.
// They are internal to uniswap, so they are not declared in the Trading API public definition.
// Once the experiment is complete, we can remove them easily or add them to the public API definition.

export enum FeeType {
  LEGACY = 'legacy',
  EIP1559 = 'eip1559',
}

export interface GasStrategy {
  limitInflationFactor: number
  displayLimitInflationFactor: number
  priceInflationFactor: number
  percentileThresholdFor1559Fee: number
  thresholdToInflateLastBlockBaseFee?: number | null
  baseFeeMultiplier?: number | null
  baseFeeHistoryWindow?: number | null
  minPriorityFeeRatioOfBaseFee?: number | null
  minPriorityFeeGwei?: number | null
  maxPriorityFeeGwei?: number | null
}

export interface GasEstimateLegacy {
  gasPrice: string
  gasLimit: string
  type: FeeType.LEGACY
  strategy: GasStrategy
  gasFee: string
}

export interface GasEstimateEip1559 {
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  gasLimit: string
  type: FeeType.EIP1559
  strategy: GasStrategy
  gasFee: string
}

export type GasEstimate = GasEstimateLegacy | GasEstimateEip1559
