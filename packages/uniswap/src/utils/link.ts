import { PlatformSplitStubError } from 'utilities/src/errors'

export async function openURL(_url: string): Promise<Window | null> {
  throw new PlatformSplitStubError('openURL')
}

export async function canOpenURL(_url: string): Promise<boolean> {
  throw new PlatformSplitStubError('canOpenURL')
}
