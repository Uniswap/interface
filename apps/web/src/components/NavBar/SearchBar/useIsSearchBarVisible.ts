import { useSyncExternalStore } from 'react'
import { addMediaQueryListener, removeMediaQueryListener } from '~/utils/matchMedia'

// Collapse the inline search bar into its icon below this width (wider than the shared `xxl`
// breakpoint so the bar tucks away before the nav starts to crowd — including the Launches
// tab's Beta pill).
const SEARCH_BAR_VISIBLE_QUERY = '(min-width: 1560px)'

function subscribe(onChange: () => void): () => void {
  const mediaQuery = window.matchMedia(SEARCH_BAR_VISIBLE_QUERY)
  addMediaQueryListener(mediaQuery, onChange)
  return () => removeMediaQueryListener(mediaQuery, onChange)
}

export function useIsSearchBarVisible(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(SEARCH_BAR_VISIBLE_QUERY).matches,
    () => true,
  )
}
