import { providers } from 'ethers'
import { getProvider } from 'src/app/walletContext'
import {
  TRANSACTION_CANCELLATION_GAS_FACTOR,
  TRANSACTION_MINIMUM_GAS,
} from 'src/constants/transactions'
import { getAdjustedGasFeeParams } from 'src/features/gas/adjustGasFee'
import { attemptReplaceTransaction } from 'src/features/transactions/replaceTransaction'
import { TransactionDetails } from 'src/features/transactions/types'
import { logger } from 'src/utils/logger'
import { call } from 'typed-redux-saga'

// Note, transaction cancellation on Ethereum is inherently flaky
// The best we can do is replace the transaction and hope the original isn't mined first
// Inspiration: https://github.com/MetaMask/metamask-extension/blob/develop/app/scripts/controllers/transactions/index.js#L744
export function* attemptCancelTransaction(transaction: TransactionDetails) {
  const { chainId, hash, options } = transaction
  const oldRequest = options.request
  logger.debug('cancelTransaction', 'attemptCancelTransaction', 'Attempting tx cancellation', hash)

  const provider = yield* call(getProvider, chainId)
  const currentFeeData = yield* call([provider, provider.getFeeData])
  const feeParams = getAdjustedGasFeeParams(
    oldRequest,
    currentFeeData,
    TRANSACTION_CANCELLATION_GAS_FACTOR
  )

  const newTxRequest: providers.TransactionRequest = {
    to: transaction.from,
    value: '0x0',
    gasLimit: TRANSACTION_MINIMUM_GAS,
    ...feeParams,
  }

  yield* call(attemptReplaceTransaction, transaction, newTxRequest, true)
}
