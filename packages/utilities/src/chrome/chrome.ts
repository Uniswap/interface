// Disabling this because we need access to `chrome` in the global scope.
/* biome-ignore-all lint/style/noRestrictedGlobals: we need access to `chrome` in the global scope */

import { PlatformSplitStubError } from 'utilities/src/errors'

export function getChrome(): typeof chrome | undefined {
  throw new PlatformSplitStubError('getChrome')
}

export function getChromeWithThrow(): typeof chrome {
  throw new PlatformSplitStubError('getChromeWithThrow')
}

export function getChromeRuntime(): typeof chrome.runtime | undefined {
  throw new PlatformSplitStubError('getChromeRuntime')
}

export function getChromeRuntimeWithThrow(): typeof chrome.runtime {
  throw new PlatformSplitStubError('getChromeRuntimeWithThrow')
}
