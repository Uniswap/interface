import { SignMessageFunc } from '@universe/api'
import { arrayify, isHexString } from 'ethers/lib/utils'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'
import { signMessage } from 'wallet/src/features/wallet/signing/signing'

export function generateSignerFunc(account: Account, signerManager: SignerManager): SignMessageFunc
export function generateSignerFunc(
  account: Account | undefined,
  signerManager: SignerManager | undefined,
): SignMessageFunc | undefined
export function generateSignerFunc(
  account: Account | undefined,
  signerManager: SignerManager | undefined,
): SignMessageFunc | undefined {
  if (!account || !signerManager) {
    return undefined
  }
  return (message: string): Promise<string> => signMessage({ message, account, signerManager })
}

/**
 * Formats a message for signing based on whether it should be treated as a string or bytes.
 *
 * @param message - The message to format
 * @param signAsString - If true (e.g., for personal_sign), keep the message as a string.
 *                       Otherwise, if message is a hex string, convert it to bytes else ethers will treat the string as if it is utf8
 * @returns The formatted message ready for signing
 */
export function formatMessageForSigning(message: string, signAsString?: boolean): string | Uint8Array {
  return signAsString || typeof message !== 'string' ? message : isHexString(message) ? arrayify(message) : message
}
