import { UseGlobalShortcutOptions } from 'utilities/src/device/keyboard/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

/** A page-wide single-key shortcut on web (see the web leg for the ownership rules). No-op on mobile. */
export function useGlobalShortcut(_: UseGlobalShortcutOptions): void {
  throw new PlatformSplitStubError('useGlobalShortcut')
}
