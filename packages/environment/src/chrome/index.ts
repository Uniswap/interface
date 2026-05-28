// oxlint-disable no-restricted-globals
import { PlatformSplitStubError } from '../platform/PlatformSplitStubError'

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
