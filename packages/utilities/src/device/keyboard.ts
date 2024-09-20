import { PlatformSplitStubError } from 'utilities/src/errors'

/** Dismisses the keyboard on the mobile app. No-ops on other platforms. */
export function dismissNativeKeyboard(): void {
  throw new PlatformSplitStubError('dismissNativeKeyboard')
}
