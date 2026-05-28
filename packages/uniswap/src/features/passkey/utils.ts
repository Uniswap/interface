import type { GetExportCredentialFn } from 'uniswap/src/features/passkey/embeddedWallet'
import { PlatformSplitStubError } from 'utilities/src/errors'

export async function exportSeedPhrase(_options?: {
  walletId?: string
  signinCredential?: string
  getCredential?: GetExportCredentialFn
}): Promise<string | undefined> {
  throw new PlatformSplitStubError('exportSeedPhrase')
}
