import { PlatformSplitStubError } from '../platform/PlatformSplitStubError'

export const BUNDLE_ID = ''

// Ugly hack to get around the fact that _playwright_ doesn't have a window object
// during setup so we need to early return
function checkWindowForPlaywright(): boolean {
  return typeof window === 'undefined'
}

export function isUnitTestEnv(): boolean {
  if (checkWindowForPlaywright()) {
    return false
  }

  throw new PlatformSplitStubError('isUnitTestEnv')
}

export function isE2eTestEnv(): boolean {
  if (checkWindowForPlaywright()) {
    return true
  }

  throw new PlatformSplitStubError('isE2eTestEnv')
}

export function isTestEnv(): boolean {
  if (checkWindowForPlaywright()) {
    return false
  }

  throw new PlatformSplitStubError('isTestEnv')
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

/**
 * Set to true to send all sessions/resources to Datadog RUM from local dev.
 * Flip this locally for debugging — do not commit as true.
 */
export const localDevDatadogEnabled = false

export function isDatadogEnabled(): boolean {
  if (checkWindowForPlaywright()) {
    return false
  }

  throw new PlatformSplitStubError('isDatadogEnabled')
}
