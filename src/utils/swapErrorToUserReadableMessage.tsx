/**
 * This is hacking out the revert reason from the ethers provider thrown error however it can.
 * This error object seems to be undocumented by ethers.
 */
// eslint-disable-next-line no-restricted-imports
import { t } from '@lingui/macro'

enum SwapError {
  TRANSACTION_REJECTED = 'transaction_rejected',
  EXPIRED = 'expired',
  INSUFFICIENT_OUTPUT_AMOUNT = 'insufficient_output_amount',
  EXCESSIVE_INPUT_AMOUNT = 'exceesive_input_amount',
  TRANSFER_FROM_FAILED = 'transfer_from_failed',
  TRANSFER_FAILED = 'transfer_failed',
  K = 'k',
  TOO_LITTLE_RECEIVED = 'too_little_received',
  TOO_MUCH_REQUESTED = 'too_much_requested',
  STF = 'stf',
  TF = 'tf',
  UNKNOWN = 'unknown_error',
}

function getReason(error: any): string | undefined {
  let reason: string | undefined

  if (error.code) {
    switch (error.code) {
      case 4001:
        return 'user rejected'
    }
  }

  while (error) {
    reason = error.reason ?? error.message ?? reason
    error = error.error ?? error.data?.originalError
  }

  if (reason?.indexOf('execution reverted: ') === 0) reason = reason.substr('execution reverted: '.length)

  return reason
}

export function parseSwapError(error: any): SwapError {
  const reason = getReason(error)

  if (
    // ethers v5.7.0 wrapped error
    error?.code === 'ACTION_REJECTED' ||
    // For Rainbow :
    (reason?.match(/request/i) && reason?.match(/reject/i)) ||
    // For Frame:
    reason?.match(/declined/i) ||
    // For SafePal:
    reason?.match(/cancelled by user/i) ||
    // For Coinbase:
    reason?.match(/user denied/i) ||
    // For Fireblocks
    reason?.match(/user rejected/i)
  ) {
    return SwapError.TRANSACTION_REJECTED
  }

  switch (reason) {
    case 'UniswapV2Router: EXPIRED':
      return SwapError.EXPIRED
    case 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT':
      return SwapError.INSUFFICIENT_OUTPUT_AMOUNT
    case 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT':
      return SwapError.EXCESSIVE_INPUT_AMOUNT
    case 'TransferHelper: TRANSFER_FROM_FAILED':
      return SwapError.TRANSFER_FROM_FAILED
    case 'UniswapV2: TRANSFER_FAILED':
      return SwapError.TRANSFER_FAILED
    case 'UniswapV2: K':
      return SwapError.K
    case 'Too little received':
      return SwapError.TOO_LITTLE_RECEIVED
    case 'Too much requested':
      return SwapError.TOO_MUCH_REQUESTED
    case 'STF':
      return SwapError.STF
    case 'TF':
      return SwapError.TF
    default:
      return SwapError.UNKNOWN
  }
}

export function swapErrorToMessage(parsedError: SwapError, error: any): string {
  if (parsedError !== SwapError.TRANSACTION_REJECTED) {
    console.warn('Swap error:', error)
  }

  switch (parsedError) {
    case SwapError.TRANSACTION_REJECTED:
      return t`Transaction rejected`
    case SwapError.EXPIRED:
      return t`The transaction could not be sent because the deadline has passed. Please check that your transaction deadline is not too low.`
    case SwapError.INSUFFICIENT_OUTPUT_AMOUNT:
    case SwapError.EXCESSIVE_INPUT_AMOUNT:
      return t`This transaction will not succeed either due to price movement or fee on transfer. Try increasing your slippage tolerance.`
    case SwapError.TRANSFER_FROM_FAILED:
      return t`The input token cannot be transferred. There may be an issue with the input token.`
    case SwapError.TRANSFER_FAILED:
      return t`The output token cannot be transferred. There may be an issue with the output token.`
    case SwapError.K:
      return t`The Uniswap invariant x*y=k was not satisfied by the swap. This usually means one of the tokens you are swapping incorporates custom behavior on transfer.`
    case SwapError.TOO_LITTLE_RECEIVED:
    case SwapError.TOO_MUCH_REQUESTED:
    case SwapError.STF:
      return t`This transaction will not succeed due to price movement. Try increasing your slippage tolerance. Note: fee on transfer and rebase tokens are incompatible with Uniswap V3.`
    case SwapError.TF:
      return t`The output token cannot be transferred. There may be an issue with the output token. Note: fee on transfer and rebase tokens are incompatible with Uniswap V3.`
    case SwapError.UNKNOWN: {
      const reason = getReason(error)
      if (reason?.indexOf('undefined is not an object') !== -1) {
        return t`An error occurred when trying to execute this swap. You may need to increase your slippage tolerance. If that does not work, there may be an incompatibility with the token you are trading. Note: fee on transfer and rebase tokens are incompatible with Uniswap V3.`
      }
      return t`${reason ? reason : 'Unknown error'}. Try increasing your slippage tolerance.
Note: fee-on-transfer and rebase tokens are incompatible with Uniswap V3.`
    }
  }
}
