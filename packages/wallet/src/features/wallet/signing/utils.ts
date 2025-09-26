import { SignMessageFunc } from '@universe/api'
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
