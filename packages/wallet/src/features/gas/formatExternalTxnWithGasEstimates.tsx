import { providers } from 'ethers'
import { GasFeeResult } from 'wallet/src/features/gas/types'

/**
 * This util should be used for formatting all external txn requests with gas estimates. This is
 * primarily WC transactions and dapp transactions on extension.
 *
 * Always use our own gas estimates and override and values from the provider txn request.
 *
 */
export function formatExternalTxnWithGasEstimates({
  transaction,
  gasFeeResult,
}: {
  transaction: providers.TransactionRequest
  gasFeeResult: GasFeeResult
}): providers.TransactionRequest {
  const { params } = gasFeeResult

  // Remove preset gas params from txn, account for both type 1 and type 2 gas formats
  delete transaction.gasLimit
  delete transaction.gasPrice
  delete transaction.maxFeePerGas
  delete transaction.maxPriorityFeePerGas

  const formattedTxnWithGasEstimates: providers.TransactionRequest = {
    ...transaction,
    ...params,
  }

  return formattedTxnWithGasEstimates
}
