import { PlatformSplitStubError } from 'utilities/src/errors'

export async function exportSeedPhrase(): Promise<string | undefined> {
  throw new PlatformSplitStubError('exportSeedPhrase')
}
