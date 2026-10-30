import { Code, ConnectError } from '@connectrpc/connect'
import { WalletSignTransactionError } from '@solana/wallet-adapter-base'
import { TFunction } from 'i18next'
import { didUserReject, errorTextParts, someInErrorChain } from 'utilities/src/errors/walletRejection'
import { logger } from 'utilities/src/logger/logger'

export { didUserReject }

/** Attempts to extract a string from an error, based on common error object formats */
function getReason(error: any): string | undefined {
  let reason: string | undefined
  const seen = new WeakSet()
  while (error) {
    if (typeof error === 'object' && seen.has(error)) {
      break
    }
    if (typeof error === 'object') {
      seen.add(error)
    }
    reason = error.reason ?? error.message ?? reason
    if (typeof error === 'string') {
      return error
    } else {
      error = error.error ?? error.data?.originalError
    }
  }
  return reason
}

function isBlockedAccountOneLevel(error: any): boolean {
  if (error instanceof ConnectError && error.code === Code.Unauthenticated) {
    return true
  }
  return errorTextParts(error).some((part) => part.match(/account is blocked/i))
}

/** A backend UnauthorizedError for a sanctioned/blocked wallet (ConnectRPC `Code.Unauthenticated` or an "account is blocked" reason anywhere in the chain). */
export function isBlockedAccountError(error: any): boolean {
  return someInErrorChain(error, isBlockedAccountOneLevel)
}

// oxlint-disable-next-line no-unused-expressions -- biome-parity: oxlint is stricter here
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

  if (isBlockedAccountError(error)) {
    return t('swap.error.accountBlocked')
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
