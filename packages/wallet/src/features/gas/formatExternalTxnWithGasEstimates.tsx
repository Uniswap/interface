import { providers } from 'ethers'
import { GasFeeResult } from 'uniswap/src/features/gas/types'

/**
 * This util should be used for formatting all external txn requests with gas estimates. This is
 * primarily WC transactions and dapp transactions on extension.
 *
 * Always use our own gas estimates and override and values from the provider txn request.
 *
 */
export function formatExternalTxnWithGasEstimates<T extends providers.TransactionRequest>({
  transaction,
  gasFeeResult,
}: {
  transaction: T
  gasFeeResult: GasFeeResult
}): T {
  const { params } = gasFeeResult

  // Clone to ensure object is configurable, otherwise deleting properties may cause type errors
  const transactionClone = { ...transaction }

  // Remove preset gas params from txn, account for both type 1 and type 2 gas formats
  delete transactionClone.gasLimit
  delete transactionClone.gasPrice
  delete transactionClone.maxFeePerGas
  delete transactionClone.maxPriorityFeePerGas

  const formattedTxnWithGasEstimates: T = {
    ...transactionClone,
    ...params,
  }

  return formattedTxnWithGasEstimates
}
