import { PlatformSplitStubError } from 'utilities/src/errors'

export async function getUniqueId(): Promise<string> {
  throw new PlatformSplitStubError('getUniqueId')
}
