import { useSyncExternalStore } from 'react'
import { useMedia } from 'ui/src'
import { useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { addMediaQueryListener, removeMediaQueryListener } from '~/utils/matchMedia'

// when company menu dropdown transitions to a bottom sheet
export function useIsMobileDrawer(): boolean {
  const media = useMedia()
  return media.sm
}

// The disconnected nav carries an extra right-rail item (PreferenceMenu) next to Connect, so it
// crowds before the shared `md` breakpoint. One-off query rather than a new global breakpoint token.
const DISCONNECTED_TABS_COLLAPSED_QUERY = '(max-width: 680px)'

function subscribe(onChange: () => void): () => void {
  const mediaQuery = window.matchMedia(DISCONNECTED_TABS_COLLAPSED_QUERY)
  addMediaQueryListener(mediaQuery, onChange)
  return () => removeMediaQueryListener(mediaQuery, onChange)
}

function useIsDisconnectedNavCrowded(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DISCONNECTED_TABS_COLLAPSED_QUERY).matches,
    () => false,
  )
}

// When tabs are visible in the top level of nav (not in dropdown)
export function useTabsVisible(): boolean {
  const media = useMedia()
  const { isConnected } = useConnectionStatus()
  const isDisconnectedNavCrowded = useIsDisconnectedNavCrowded()

  if (media.md) {
    return false
  }
  return isConnected || !isDisconnectedNavCrowded
}
