import { FeeType, GasEstimateLegacy } from '@universe/api'

export const createGasEstimate = (): GasEstimateLegacy => {
  return {
    gasLimit: '21000',
    gasPrice: '20000000000',
    gasFee: '42000000000000',
    type: FeeType.LEGACY,
    strategy: {
      limitInflationFactor: 1,
      displayLimitInflationFactor: 1,
      priceInflationFactor: 1,
      percentileThresholdFor1559Fee: 1,
    },
  }
}
