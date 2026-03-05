import { PlatformSplitStubError } from 'utilities/src/errors'

/** Detects if a virtual keyboard is open on mobile web platforms. No-op on native. */
export const useIsKeyboardOpen = (_minKeyboardHeight?: number): boolean => {
  throw new PlatformSplitStubError('useIsKeyboardOpen')
}
