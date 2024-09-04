import { PlatformSplitStubError } from 'utilities/src/errors'

export function initFirebaseAppCheck(): void {
  throw new PlatformSplitStubError('initFirebaseAppCheck')
}

export async function getFirebaseAppCheckToken(): Promise<string | null> {
  throw new PlatformSplitStubError('getFirebaseAppCheckToken')
}
