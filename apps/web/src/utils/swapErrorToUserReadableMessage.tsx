import { WalletSignTransactionError } from '@solana/wallet-adapter-base'
import { TFunction } from 'i18next'
import { logger } from 'utilities/src/logger/logger'
import { UserRejectedRequestError } from '~/utils/errors'

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

/** Text segments from a structured error (Rainbow-style checks use each part separately so /request/ + /reject/ cannot match across fields). */
function rejectionParts(error: any): string[] {
  if (typeof error === 'string') {
    return error ? [error] : []
  }
  if (!error || typeof error !== 'object') {
    return []
  }
  const shortMessage = 'shortMessage' in error && typeof error.shortMessage === 'string' ? error.shortMessage : ''
  const message = typeof error.message === 'string' ? error.message : ''
  const reason = typeof error.reason === 'string' ? error.reason : ''
  return [shortMessage, message, reason].filter((s): s is string => s.length > 0)
}

function isWalletRejectionRpcCode(code: unknown): boolean {
  if (code === 4001 || code === 5750) {
    return true
  }
  if (code === 'ACTION_REJECTED') {
    return true
  }
  // Some providers stringify JSON-RPC codes; viem may surface bigint.
  if (typeof code === 'string' && (code === '4001' || Number(code) === 4001)) {
    return true
  }
  if (typeof code === 'bigint' && code === 4001n) {
    return true
  }
  return false
}

function didUserRejectOneLevel(error: any): boolean {
  const parts = rejectionParts(error)
  const reason = parts.join(' ')
  const isRainbowStyleRejection = parts.some((part) => part.match(/request/i) && part.match(/reject/i))
  if (
    isWalletRejectionRpcCode(error?.code) ||
    // For Rainbow (both patterns must appear in the same segment):
    isRainbowStyleRejection ||
    // For Frame:
    reason.match(/declined/i) ||
    // For SafePal:
    reason.match(/cancell?ed by user/i) ||
    // For Trust:
    reason.match(/user cancell?ed/i) ||
    // For Coinbase:
    reason.match(/user denied/i) ||
    // For Fireblocks
    reason.match(/user rejected/i) ||
    // For Binance:
    reason.match(/closed modal/i) ||
    // For Solflare connection:
    reason.match(/connection rejected/i) ||
    // For Solflare transaction rejection:
    reason.match(/transaction cancelled/i) ||
    error instanceof UserRejectedRequestError
  ) {
    return true
  }
  return false
}

/** Walks `cause`, `originalError`, and legacy `error` / `data.originalError` chains (wallets + viem + our transaction wrappers). */
export function didUserReject(error: any): boolean {
  const visited = new WeakSet<object>()
  const queue: any[] = [error]
  while (queue.length > 0) {
    const current = queue.pop()
    if (!current) {
      continue
    }
    if (typeof current === 'object') {
      if (visited.has(current)) {
        continue
      }
      visited.add(current)
    }
    if (didUserRejectOneLevel(current)) {
      return true
    }
    const next: unknown[] = []
    if (typeof current === 'object' && current !== null) {
      if ('cause' in current && current.cause) {
        next.push(current.cause)
      }
      if ('originalError' in current && current.originalError) {
        next.push(current.originalError)
      }
      if ('error' in current && current.error) {
        next.push(current.error)
      }
      if ('data' in current && current.data && typeof current.data === 'object' && 'originalError' in current.data) {
        next.push(current.data.originalError)
      }
      if ('details' in current && Array.isArray(current.details)) {
        for (const detail of current.details) {
          next.push(detail)
        }
      }
    }
    for (const n of next) {
      queue.push(n)
    }
  }
  return false
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
