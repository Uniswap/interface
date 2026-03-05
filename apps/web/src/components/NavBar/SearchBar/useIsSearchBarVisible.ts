import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMedia } from 'ui/src'

export function useIsSearchBarVisible() {
  const media = useMedia()
  return !media.xxl
}
