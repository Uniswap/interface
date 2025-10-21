import { useMemo } from 'react'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { useDeviceInsets } from 'ui/src/hooks/useDeviceInsets'
import { useTestnetModeBannerHeight } from 'uniswap/src/features/settings/hooks'

export const useAppInsets = (): {
  top: number
  right: number
  bottom: number
  left: number
} => {
  const insets = useDeviceInsets()
  const testnetBannerInset = useTestnetModeBannerHeight()

  return useMemo(
    () => ({
      right: insets.right,
      bottom: insets.bottom,
      left: insets.left,
      top: insets.top + testnetBannerInset,
    }),
    [insets.top, insets.right, insets.bottom, insets.left, testnetBannerInset],
  )
}
