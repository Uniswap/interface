import { ethers } from 'ethers'
import { PlatformSplitStubError } from 'utilities/src/errors'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'

export type SignMessageInfo = {
  message: string
  account: Account
  signerManager: SignerManager
  provider?: ethers.providers.JsonRpcProvider
}

// https://docs.ethers.io/v5/api/signer/#Signer--signing-methods
export async function signMessage(_signInfo: SignMessageInfo): Promise<string> {
  throw new PlatformSplitStubError('signMessage')
}

export async function signTypedDataMessage(_signInfo: SignMessageInfo): Promise<string> {
  throw new PlatformSplitStubError('signTypedDataMessage')
}
