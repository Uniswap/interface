import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

/** Phantom will throw an error with this message if dapp attempts to connect when the wallet is pointed at a single platform / (private key import). */
const PHANTOM_SINGLE_PLATFORM_MESSAGE = 'Requested resource not available'

const IGNOREABLE_ERROR_RULES = [
  (error: any) => didUserReject(error),
  (error: any) => error?.message?.includes?.(PHANTOM_SINGLE_PLATFORM_MESSAGE),
]

/**
 * Checks if an error should be ignored when connecting to a wallet.
 * @param error - The error to check.
 * @returns True if the error should be ignored, false otherwise.
 */
export function ignoreExpectedConnectionErrors(error: any): boolean {
  return IGNOREABLE_ERROR_RULES.some((checkRule) => checkRule(error))
}
