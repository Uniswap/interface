import { ethers } from 'ethers'
import { PlatformSplitStubError } from 'utilities/src/errors'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'

export type SignMessageInfo = {
  message: string
  account: Account
  signerManager: SignerManager
  provider?: ethers.providers.JsonRpcProvider
  /**
   * If true, the message will be signed as-is without any hex string to bytes conversion.
   * This is needed for personal_sign where the message should remain a string for proper EIP-191 hashing.
   * @default false
   */
  signAsString?: boolean
}

// https://docs.ethers.io/v5/api/signer/#Signer--signing-methods
export async function signMessage(_signInfo: SignMessageInfo): Promise<string> {
  throw new PlatformSplitStubError('signMessage')
}

export async function signTypedDataMessage(_signInfo: SignMessageInfo): Promise<string> {
  throw new PlatformSplitStubError('signTypedDataMessage')
}
