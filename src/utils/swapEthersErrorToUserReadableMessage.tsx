export function swapEthersErrorToUserReadableMessage(error: any): string {
  const errorCode = error?.code

  let messageString = ''
  switch (errorCode) {
    //Generic Errors
    case 'NOT_IMPLEMENTED':
      messageString = 'Functionality not implemented.'
      break
    case 'UNSUPPORTED_OPERATION':
      messageString = 'Unsupported operation.'
      break
    case 'NETWORK_ERROR':
      messageString = 'Network error.'
      break
    case 'SERVER_ERROR':
      messageString = 'Server error.'
      break
    case 'TIMEOUT':
      messageString = 'Timeout.'
      break
    case 'BAD_DATA':
      messageString = 'Bad data.'
      break
    case 'CANCELLED':
      messageString = 'Transaction cancelled.'
      break
    //Operational Errors
    case 'BUFFER_OVERRUN':
      messageString = 'Buffer overrun.'
      break
    case 'NUMERIC_FAULT':
      messageString = 'Numeric fault.'
      break
    //Argument Errors
    case 'INVALID_ARGUMENT':
      messageString = 'Invalid argument in transaction.'
      break
    case 'MISSING_ARGUMENT':
      messageString = 'Missing argument in transaction.'
      break
    case 'UNEXPECTED_ARGUMENT':
      messageString = 'Unexpected argument in transaction.'
      break
    case 'VALUE_MISMATCH':
      messageString = 'Value mismatch. Please check your input data.'
      break
    //Blockchain Errors
    case 'CALL_EXCEPTION':
      messageString = 'Call exception. Please check your input data.'
      break
    case 'INSUFFICIENT_FUNDS':
      messageString = 'Insufficient funds in your account. Please check your balance before submitting again.'
      break
    case 'NONCE_EXPIRED':
      messageString = 'Nonce expired. Resubmit your transaction with a new nonce.'
      break
    case 'REPLACEMENT_UNDERPRICED':
      messageString = 'Replacement transaction underpriced. Please resubmit your transaction with a higher gas price.'
      break
    case 'TRANSACTION_REPLACED':
      messageString = 'Transaction replaced with another. Please check your transaction status.'
      break
    case 'UNCONFIGURED_NAME':
      messageString = 'Unconfigured name. Please check your input data.'
      break
    case 'OFFCHAIN_FAULT':
      messageString = 'Offchain fault. Please check your input data.'
      break
    case 'UNPREDICTABLE_GAS_LIMIT':
      messageString = 'Unpredictable gas limit. Please check your gas limit and try again.'
      break
    case 'ACTION_REJECTED':
      messageString = 'Action rejected by user. You may have rejected a transaction signature request.'
      break
    default:
      messageString = 'Unknown error.'
      break
  }

  return `${messageString} Try increasing your slippage tolerance. Note: fee-on-transfer and rebase tokens are incompatible with Uniswap V3.`
}
