import { ethers } from 'ethers'
import { PlatformSplitStubError } from 'utilities/src/errors'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'

// https://docs.ethers.io/v5/api/signer/#Signer--signing-methods
export async function signMessage(
  _message: string,
  _account: Account,
  _signerManager: SignerManager,
  _provider?: ethers.providers.JsonRpcProvider,
): Promise<string> {
  throw new PlatformSplitStubError('signMessage')
}

export async function signTypedDataMessage(
  _message: string,
  _account: Account,
  _signerManager: SignerManager,
  _provider?: ethers.providers.JsonRpcProvider,
): Promise<string> {
  throw new PlatformSplitStubError('signTypedDataMessage')
}
