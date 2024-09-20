import { PlatformSplitStubError } from 'utilities/src/errors'

export function isTestEnv(): boolean {
  throw new PlatformSplitStubError('isTestEnv')
}

export function isDevEnv(): boolean {
  throw new PlatformSplitStubError('isDevEnv')
}

export function isBetaEnv(): boolean {
  throw new PlatformSplitStubError('isBetaEnv')
}

export function isProdEnv(): boolean {
  throw new PlatformSplitStubError('isProdEnv')
}
