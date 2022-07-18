import { BigNumber, FixedNumber } from 'ethers'
import { GAS_INFLATION_FACTOR } from 'src/constants/gas'
import { FeeInfo, FeeType } from 'src/features/gas/types'
import { fixedNumberToInt } from 'src/utils/number'

export function getGasPrice(gasInfo: FeeInfo): string {
  return gasInfo.type === FeeType.Eip1559
    ? BigNumber.from(gasInfo.feeDetails.maxBaseFeePerGas)
        .add(gasInfo.feeDetails.maxPriorityFeePerGas.urgent)
        .toString()
    : gasInfo.gasPrice
}

export function getGasAfterInflation(gasEstimate: number | BigNumber | string): string {
  return fixedNumberToInt(
    FixedNumber.from(gasEstimate).mulUnsafe(FixedNumber.from(GAS_INFLATION_FACTOR.toString()))
  )
}
