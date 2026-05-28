import { PlatformSplitStubError } from 'utilities/src/errors'

export function initializeDatadog(_appName: string): Promise<void> {
  throw new PlatformSplitStubError('initializeDatadog')
}
