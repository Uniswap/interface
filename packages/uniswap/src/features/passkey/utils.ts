import { PlatformSplitStubError } from 'utilities/src/errors'

export async function exportSeedPhrase(walletId?: string): Promise<string | undefined> {
  throw new PlatformSplitStubError('exportSeedPhrase')
}
