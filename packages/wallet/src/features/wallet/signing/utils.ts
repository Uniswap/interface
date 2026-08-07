import { SignMessageFunc } from '@universe/api'
import { arrayify, isHexString } from 'ethers/lib/utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedDappChainId } from 'uniswap/src/features/chains/utils'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'
import { signMessage } from 'wallet/src/features/wallet/signing/signing'
import { EthTypedMessage } from 'wallet/src/features/wallet/signing/types'

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

/**
 * Parses raw EIP-712 typed data into the shape ethers wants to sign: validates the domain is bound
 * to the authorized chain, then strips `EIP712Domain` so ethers can infer the primary type.
 *
 * Intake rejects chain mismatches first with a proper JSON-RPC error; this is the backstop, because
 * the signature itself commits to `domain.chainId`. A domain with no chainId throws too.
 */
export function prepareTypedDataForSigning({
  message,
  expectedChainId,
}: {
  message: string
  expectedChainId: UniverseChainId
}): EthTypedMessage {
  // Dapp-supplied, so `domain` can be absent at runtime despite the type.
  const parsedData = JSON.parse(message) as Omit<EthTypedMessage, 'domain'> & {
    domain?: EthTypedMessage['domain']
  }

  const domainChainId = toSupportedDappChainId(parsedData.domain?.chainId)
  if (domainChainId !== expectedChainId) {
    throw new Error(
      `Typed data domain chainId does not match the authorized chain. Expected ${expectedChainId}, received ${String(parsedData.domain?.chainId)}`,
    )
  }

  // ethers computes EIP712Domain type for you, so we should not pass it in directly
  // or else ethers will get confused about which type is the primary type
  // https://github.com/ethers-io/ethers.js/issues/687#issuecomment-714069471
  delete parsedData.types['EIP712Domain']

  // Safe: a domainless payload can't reach here, toSupportedDappChainId returns null for it.
  return parsedData as EthTypedMessage
}
