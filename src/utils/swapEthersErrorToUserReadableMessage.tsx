import { t } from '@lingui/macro'

import { getReason } from './swapErrorToUserReadableMessage'

export function swapEthersErrorToUserReadableMessage(error: any): string {
  const reason = getReason(error)
  const errorCode = error?.code

  const reasonString = 'Error Message: ' + t`${reason ? reason : 'unknown error'}` + '.'
  let messageString = ''
  switch (errorCode) {
    //Generic Errors
    case 'NOT_IMPLEMENTED':
      messageString = t`Functionality not implemented.`
      break
    case 'UNSUPPORTED_OPERATION':
      messageString = t`Unsupported operation.`
      break
    case 'NETWORK_ERROR':
      messageString = t`Network error.`
      break
    case 'SERVER_ERROR':
      messageString = t`Server error.`
      break
    case 'TIMEOUT':
      messageString = t`Timeout.`
      break
    case 'BAD_DATA':
      messageString = t`Bad data.`
      break
    case 'CANCELLED':
      messageString = t`Transaction cancelled.`
      break
    //Operational Errors
    case 'BUFFER_OVERRUN':
      messageString = t`Buffer overrun.`
      break
    case 'NUMERIC_FAULT':
      messageString = t`Numeric fault.`
      break
    //Argument Errors
    case 'INVALID_ARGUMENT':
      messageString = t`Invalid argument in transaction.`
      break
    case 'MISSING_ARGUMENT':
      messageString = t`Missing argument in transaction.`
      break
    case 'UNEXPECTED_ARGUMENT':
      messageString = t`Unexpected argument in transaction.`
      break
    case 'VALUE_MISMATCH':
      messageString = t`Value mismatch.`
      break
    //Blockchain Errors
    case 'CALL_EXCEPTION':
      messageString = t`Call exception. Please check your input data. Try increasing your slippage tolerance. Note: fee-on-transfer and rebase tokens are incompatible with Uniswap V3.`
      break
    case 'INSUFFICIENT_FUNDS':
      messageString = t`Insufficient funds in your account. Please check your balance before submitting again.`
      break
    case 'NONCE_EXPIRED':
      messageString = t`Nonce expired. Resubmit your transaction with a new nonce. Try increasing your slippage tolerance. Note: fee-on-transfer and rebase tokens are incompatible with Uniswap V3.`
      break
    case 'REPLACEMENT_UNDERPRICED':
      messageString = t`Replacement transaction underpriced. Please resubmit your transaction with a higher gas price. Try increasing your slippage tolerance. Note: fee-on-transfer and rebase tokens are incompatible with Uniswap V3.`
      break
    case 'TRANSACTION_REPLACED':
      messageString = t`Transaction replaced with another.`
      break
    case 'UNCONFIGURED_NAME':
      messageString = t`Unconfigured name.`
      break
    case 'OFFCHAIN_FAULT':
      messageString = t`Offchain fault.`
      break
    case 'UNPREDICTABLE_GAS_LIMIT':
      messageString = t`Unpredictable gas limit. Please check your gas limit and try again. Try increasing your slippage tolerance. Note: fee-on-transfer and rebase tokens are incompatible with Uniswap V3.`
      break
    case 'ACTION_REJECTED':
      messageString = t`Action rejected by user.`
      break
    default:
      messageString = t`Try increasing your slippage tolerance. Note: fee-on-transfer and rebase tokens are incompatible with Uniswap V3.`
      break
  }

  return `${reasonString} ${messageString}`
}
