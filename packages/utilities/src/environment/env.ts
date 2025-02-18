import { PlatformSplitStubError } from 'utilities/src/errors'

export function isTestEnv(): boolean {
  throw new PlatformSplitStubError('isTestEnv')
}

export function isPlaywrightEnv(): boolean {
  throw new PlatformSplitStubError('isPlaywrightEnv')
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

export function isRNDev(): boolean {
  // Ugly hack to get around the fact that _playwright_ doesn't have a window object
  // during setup so we need to early return false here
  if (typeof window === 'undefined') {
    return false
  }

  // Ugly hack to get around the fact that cypress accesses this function during setup
  // and doesn't know it's actually a web function it just throws the PlatformSplitStubError
  // so we need to early return false here
  if (window.Cypress) {
    return false
  }

  throw new PlatformSplitStubError('isRNDev')
}
