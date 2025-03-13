import type { EdgeInsets } from 'react-native-safe-area-context'
// eslint-disable-next-line no-restricted-imports
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DEFAULT_BOTTOM_INSET } from 'ui/src/hooks/constants'

export const useDeviceInsets = (): EdgeInsets => {
  const insets = useSafeAreaInsets()

  if (insets.bottom === 0) {
    // Add bottom padding on devices which don't have on-screen navigation bar
    insets.bottom = DEFAULT_BOTTOM_INSET
  }

  return insets
}
