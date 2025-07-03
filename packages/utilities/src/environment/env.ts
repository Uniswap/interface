import { PlatformSplitStubError } from 'utilities/src/errors'

// Ugly hack to get around the fact that _playwright_ doesn't have a window object
// during setup so we need to early return
function checkWindowForPlaywright(): boolean {
  return typeof window === 'undefined'
}

export function isTestEnv(): boolean {
  if (checkWindowForPlaywright()) {
    return false
  }

  throw new PlatformSplitStubError('isTestEnv')
}

export function isPlaywrightEnv(): boolean {
  if (checkWindowForPlaywright()) {
    return true
  }

  throw new PlatformSplitStubError('isPlaywrightEnv')
}

export function isDevEnv(): boolean {
  if (checkWindowForPlaywright()) {
    return false
  }

  throw new PlatformSplitStubError('isDevEnv')
}

export function isBetaEnv(): boolean {
  if (checkWindowForPlaywright()) {
    return false
  }

  throw new PlatformSplitStubError('isBetaEnv')
}

export function isProdEnv(): boolean {
  throw new PlatformSplitStubError('isProdEnv')
}

export function isRNDev(): boolean {
  if (checkWindowForPlaywright()) {
    return false
  }

  throw new PlatformSplitStubError('isRNDev')
}
