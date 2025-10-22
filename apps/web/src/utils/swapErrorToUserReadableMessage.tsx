import { WalletSignTransactionError } from '@solana/wallet-adapter-base'
import { TFunction } from 'i18next'
import { logger } from 'utilities/src/logger/logger'
import { UserRejectedRequestError } from 'utils/errors'

/** Attempts to extract a string from an error, based on common error object formats */
function getReason(error: any): string | undefined {
  let reason: string | undefined
  while (error) {
    reason = error.reason ?? error.message ?? reason
    if (typeof error === 'string') {
      return error
    } else {
      error = error.error ?? error.data?.originalError
    }
  }
  return reason
}

export function didUserReject(error: any): boolean {
  const reason = getReason(error)
  if (
    error?.code === 4001 ||
    // eip-5792 upgrade rejected error https://eips.ethereum.org/EIPS/eip-5792#error-codes
    error?.code === 5750 ||
    // ethers v5.7.0 wrapped error
    error?.code === 'ACTION_REJECTED' ||
    // For Rainbow :
    (reason?.match(/request/i) && reason.match(/reject/i)) ||
    // For Frame:
    reason?.match(/declined/i) ||
    // For SafePal:
    reason?.match(/cancell?ed by user/i) ||
    // For Trust:
    reason?.match(/user cancell?ed/i) ||
    // For Coinbase:
    reason?.match(/user denied/i) ||
    // For Fireblocks
    reason?.match(/user rejected/i) ||
    // For Binance:
    reason?.match(/closed modal/i) ||
    // For Solflare connection:
    reason?.match(/connection rejected/i) ||
    // For Solflare transaction rejection:
    reason?.match(/transaction cancelled/i) ||
    error instanceof UserRejectedRequestError
  ) {
    return true
  }
  return false
}

WalletSignTransactionError
/**
 * This is hacking out the revert reason from the ethers provider thrown error however it can.
 * This object seems to be undocumented by ethers.
 * @param error - An error from the ethers provider
 */
export function swapErrorToUserReadableMessage(t: TFunction, error: any): string {
  if (didUserReject(error)) {
    return t('swap.error.rejected')
  }

  let reason = getReason(error)
  if (reason?.indexOf('execution reverted: ') === 0) {
    reason = reason.substr('execution reverted: '.length)
  }

  switch (reason) {
    case 'UniswapV2Router: EXPIRED':
      return t('swap.error.v2.expired')
    case 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT':
    case 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT':
      return t('swap.error.v2.slippage')
    case 'TransferHelper: TRANSFER_FROM_FAILED':
      return t('swap.error.v2.transferInput')
    case 'UniswapV2: TRANSFER_FAILED':
      return t('swap.error.v2.transferOutput')
    case 'UniswapV2: K':
      return t('swap.error.v2.k')
    case 'Too little received':
    case 'Too much requested':
    case 'STF':
      return t('swap.error.v3.slippage')
    case 'TF':
      return t('swap.error.v3.transferOutput')
    default:
      if (reason && reason.indexOf('undefined is not an object') !== -1) {
        logger.warn(
          'swapErrorToUserReadableMessage',
          'swapErrorToUserReadableMessage',
          'Undefined object error',
          reason,
        )
        return t('swap.error.undefinedObject')
      }
      return `${reason ?? t('swap.error.unknown')} ${t('swap.error.default')}`
  }
}
