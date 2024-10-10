// eslint-disable-next-line no-restricted-imports
import { useDeviceInsets } from 'ui/src/hooks/useDeviceInsets'
import { useEnabledChains } from 'uniswap/src/features/settings/hooks'
import { isMobileApp } from 'utilities/src/platform'

export const TESTNET_MODE_BANNER_HEIGHT = 44
export const useAppInsets = (): {
  top: number
  right: number
  bottom: number
  left: number
} => {
  const { isTestnetModeEnabled } = useEnabledChains()
  const insets = useDeviceInsets()

  const extraTop = isTestnetModeEnabled && isMobileApp ? TESTNET_MODE_BANNER_HEIGHT : 0
  return { ...insets, top: insets.top + extraTop }
}
