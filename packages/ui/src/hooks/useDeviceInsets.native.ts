import type { EdgeInsets } from 'react-native-safe-area-context'
// biome-ignore lint/style/noRestrictedImports: useSafeAreaInsets is allowed for this use case
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DEFAULT_BOTTOM_INSET } from 'ui/src/hooks/constants'

export function useDeviceInsets(): EdgeInsets {
  const insets = useSafeAreaInsets()

  if (insets.bottom === 0) {
    // Add bottom padding on devices which don't have on-screen navigation bar
    insets.bottom = DEFAULT_BOTTOM_INSET
  }

  return insets
}
