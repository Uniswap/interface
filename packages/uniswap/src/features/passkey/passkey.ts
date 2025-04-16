import { PlatformSplitStubError } from 'utilities/src/errors'

export async function registerPasskey(_challenge: string): Promise<string> {
  throw new PlatformSplitStubError('registerPasskey')
}

export async function authenticatePasskey(_challenge: string): Promise<string> {
  throw new PlatformSplitStubError('authenticatePasskey')
}
