import { providers } from 'ethers'
import { GasFeeResult } from 'wallet/src/features/gas/types'

/**
 * This util should be used for formatting all external txn requests with gas estimates. This is
 * primarily WC transactions and dapp transactions on extension.
 *
 * We should always be using the estimates from a dapp if they are provided. `gasLimit` will not
 * always be included along with fee estimates - use our limit in that case if missing.
 *
 * If no valid fee combination is found (for legacy type 1, or eip1559 type 2), we should use our own
 * estimates instead. Our estimates come from a request to our gas service in both WC and Dapp interaction
 * flows.
 *
 */

export function formatExternalTxnWithGasEstimates({
  transaction,
  gasFeeResult,
}: {
  transaction: providers.TransactionRequest
  gasFeeResult: GasFeeResult
}): providers.TransactionRequest {
  const { gasLimit: gasLimitDapp, gasPrice, maxFeePerGas, maxPriorityFeePerGas } = transaction
  const requestHasLegacyGasValues = !!gasPrice
  const requestHasEIP1559GasValues = !!maxFeePerGas && !!maxPriorityFeePerGas
  const requestHasValidGasEstimates = requestHasLegacyGasValues || requestHasEIP1559GasValues

  if (requestHasValidGasEstimates) {
    return {
      ...transaction,
      // Avoid `??` in case dapp passes empty string
      gasLimit: gasLimitDapp || gasFeeResult?.params?.gasLimit,
    }
  }

  const formattedTxnWithGasEstimates: providers.TransactionRequest = {
    ...transaction,
    ...gasFeeResult.params,
  }

  return formattedTxnWithGasEstimates
}
