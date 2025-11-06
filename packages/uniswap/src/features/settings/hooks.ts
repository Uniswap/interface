import { useSelector } from 'react-redux'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import {
  // biome-ignore lint/style/noRestrictedImports: expected usage here
  selectIsTestnetModeEnabled,
  selectWalletHideReportedActivitySetting,
  selectWalletHideSmallBalancesSetting,
  selectWalletHideSpamTokensSetting,
} from 'uniswap/src/features/settings/selectors'
import { isMobileApp } from 'utilities/src/platform'

export function useHideSmallBalancesSetting(): boolean {
  const { isTestnetModeEnabled } = useEnabledChains()

  return useSelector(selectWalletHideSmallBalancesSetting) && !isTestnetModeEnabled
}

export function useHideSpamTokensSetting(): boolean {
  return useSelector(selectWalletHideSpamTokensSetting)
}

export function useHideReportedActivitySetting(): boolean {
  return useSelector(selectWalletHideReportedActivitySetting)
}

export const TESTNET_MODE_BANNER_HEIGHT = 44

function useIsTestnetModeEnabled(): boolean {
  return useSelector(selectIsTestnetModeEnabled)
}

/**
 * Use to account for an inset when `useAppInsets()` is not available
 *
 * @returns The height of the testnet mode banner if testnet mode is enabled, otherwise 0
 */
export function useTestnetModeBannerHeight(): number {
  const isTestnetModeEnabled = useIsTestnetModeEnabled()

  return isTestnetModeEnabled && isMobileApp ? TESTNET_MODE_BANNER_HEIGHT : 0
}
