import { PlatformSplitStubError } from 'utilities/src/errors'

/**
 * Escape coordination for custom web overlays (bottom sheets, the account drawer, inline
 * popovers): ONE stack of open layers, and Escape closes only the top one. Shared by the legacy
 * `ui/src` sheet and the mycelium compat sheet so arbitration keeps working while both render in
 * the same app during the Tamagui → Tailwind migration.
 *
 * Web-only — use from `*.web.tsx` files.
 */
export function useDismissLayer(_params: { isOpen: boolean; onClose?: () => void }): void {
  throw new PlatformSplitStubError('useDismissLayer')
}

/** Marks an Escape keydown as consumed by sheet chrome (see the web leg). */
export function markRadixEscapePreventedBySheet(_event: KeyboardEvent): void {
  throw new PlatformSplitStubError('markRadixEscapePreventedBySheet')
}
