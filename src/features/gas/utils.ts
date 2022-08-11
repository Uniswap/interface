import { BigNumber } from 'ethers'
import { FeeInfo, FeeType } from 'src/features/gas/types'
import { formatAsHexString } from 'src/features/transactions/swap/utils'

// For whatever reason Ethers throws for L2s if we don't convert strings to hex strings
export const getTxGasSettings = (gasFeeInfo: FeeInfo) => {
  return gasFeeInfo.type === FeeType.Eip1559
    ? {
        maxFeePerGas: formatAsHexString(
          BigNumber.from(gasFeeInfo.feeDetails.maxBaseFeePerGas)
            .add(gasFeeInfo.feeDetails.maxPriorityFeePerGas.urgent)
            .toString()
        ),
        maxPriorityFeePerGas: formatAsHexString(gasFeeInfo.feeDetails.maxPriorityFeePerGas.urgent),
        gasLimit: formatAsHexString(gasFeeInfo.gasLimit),
      }
    : {
        gasPrice: formatAsHexString(gasFeeInfo.gasPrice),
        gasLimit: formatAsHexString(gasFeeInfo.gasLimit),
      }
}
