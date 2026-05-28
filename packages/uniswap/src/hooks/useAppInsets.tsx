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

  return { ...insets, top: insets.top + testnetBannerInset }
}
