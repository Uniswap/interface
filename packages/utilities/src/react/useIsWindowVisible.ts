import { PlatformSplitStubError } from 'utilities/src/errors'

/**
 * Returns whether the window/document is currently visible to the user.
 * Useful for pausing expensive operations (like animations) when the tab is in the background.
 *
 * On web: tracks document.visibilityState
 * On native: always returns true (native apps don't have "hidden tabs")
 */
export function useIsWindowVisible(): boolean {
  throw new PlatformSplitStubError('useIsWindowVisible')
}
