import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { useSyncExternalStore } from 'react'
import { useTabsVisible } from '~/app/layout/NavBar/ScreenSizes'
import { addMediaQueryListener, removeMediaQueryListener } from '~/utils/matchMedia'

// Collapse the inline search bar into its icon below this width (wider than the shared `xxl`
// breakpoint so the bar tucks away before the nav starts to crowd — including the Launches
// tab's Beta pill).
const SEARCH_BAR_VISIBLE_QUERY = '(min-width: 1560px)'

export enum NavSearchVariant {
  Icon = 'icon',
  LegacyInput = 'legacyInput',
  Input = 'input',
  CompactInput = 'compactInput',
}

function subscribe(onChange: () => void): () => void {
  const mediaQuery = window.matchMedia(SEARCH_BAR_VISIBLE_QUERY)
  addMediaQueryListener(mediaQuery, onChange)
  return () => removeMediaQueryListener(mediaQuery, onChange)
}

export function useNavSearchVariant(): NavSearchVariant {
  const isNewUserUxEnabled = useFeatureFlag(FeatureFlags.NewUserUx)
  const media = useMedia()
  const areTabsVisible = useTabsVisible()
  const isWideEnough = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(SEARCH_BAR_VISIBLE_QUERY).matches,
    () => true,
  )

  if (!isNewUserUxEnabled) {
    return isWideEnough ? NavSearchVariant.LegacyInput : NavSearchVariant.Icon
  }
  if (media.md) {
    return NavSearchVariant.Icon
  }
  // The input returns once the tabs fold into the hamburger and free the room.
  if (!areTabsVisible) {
    return NavSearchVariant.CompactInput
  }
  if (media.xl) {
    return NavSearchVariant.Icon
  }
  return NavSearchVariant.Input
}
