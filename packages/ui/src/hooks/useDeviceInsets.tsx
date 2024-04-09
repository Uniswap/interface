// eslint-disable-next-line no-restricted-imports
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context'
import { spacing } from 'ui/src/theme'

export const DEFAULT_BOTTOM_INSET = spacing.spacing20

export const useDeviceInsets = (): EdgeInsets => {
  const insets = useSafeAreaInsets()

  if (insets.bottom === 0) {
    // Add bottom padding on devices which don't have on-screen navigation bar
    insets.bottom = DEFAULT_BOTTOM_INSET
  }

  return insets
}
