import { useNavigation } from '@react-navigation/core'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { OnboardingStackNavigationProp, SettingsStackNavigationProp } from 'src/app/navigation/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { setIsTestnetModeEnabled } from 'uniswap/src/features/settings/slice'
import { ModalName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { SmartWalletAdvancedSettingsModalState } from 'wallet/src/components/smartWallet/modals/SmartWalletAdvancedSettingsModal'

// avoids rendering during animation which makes it laggy
// set to a bit above the Switch animation "simple" which is 80ms
const AVOID_RENDER_DURING_ANIMATION_MS = 100

type AdvancedSettingsMenuState = SmartWalletAdvancedSettingsModalState & {
  /** Toggle handler that takes no arguments - for use with settings row toggles */
  handleTestnetModeToggle: () => void
}

type UseAdvancedSettingsMenuStateOptions = {
  /** Optional callback to close the modal. If not provided, uses navigation.goBack() */
  onClose?: () => void
}

/**
 * Hook that provides the state and callbacks needed to open and interact with
 * the SmartWalletAdvancedSettingsModal. Used by both the Settings screen and
 * the TestnetModeBanner navigation.
 */
export function useAdvancedSettingsMenuState(options?: UseAdvancedSettingsMenuStateOptions): AdvancedSettingsMenuState {
  const navigation = useNavigation<SettingsStackNavigationProp & OnboardingStackNavigationProp>()
  const dispatch = useDispatch()
  const { isTestnetModeEnabled } = useEnabledChains()

  const handleTestnetModeToggleInternal = useCallback(
    (newIsTestnetMode: boolean): void => {
      const fireAnalytic = (): void =>
        sendAnalyticsEvent(WalletEventName.TestnetModeToggled, {
          enabled: newIsTestnetMode,
          location: 'settings',
        })

      // Close the advanced settings modal first
      if (options?.onClose) {
        options.onClose()
      } else {
        navigation.goBack()
      }

      setTimeout(() => {
        // trigger before toggling on (ie disabling analytics)
        if (newIsTestnetMode) {
          fireAnalytic()
          navigation.navigate(ModalName.TestnetMode, {})
        }

        dispatch(setIsTestnetModeEnabled(newIsTestnetMode))

        // trigger after toggling off (ie enabling analytics)
        if (!newIsTestnetMode) {
          fireAnalytic()
        }
      }, AVOID_RENDER_DURING_ANIMATION_MS)
    },
    [dispatch, navigation, options],
  )

  // Handler for modal switch (receives isChecked from switch component)
  const onTestnetModeToggled = useCallback(
    (isChecked: boolean): void => {
      handleTestnetModeToggleInternal(isChecked)
    },
    [handleTestnetModeToggleInternal],
  )

  // Handler for settings row toggle (no arguments, toggles current state)
  const handleTestnetModeToggle = useCallback((): void => {
    handleTestnetModeToggleInternal(!isTestnetModeEnabled)
  }, [handleTestnetModeToggleInternal, isTestnetModeEnabled])

  const onPressSmartWallet = useCallback((): void => {
    navigation.navigate(MobileScreens.SettingsSmartWallet)
  }, [navigation])

  const onPressStorage = useCallback((): void => {
    navigation.navigate(MobileScreens.SettingsStorage)
  }, [navigation])

  return {
    isTestnetEnabled: isTestnetModeEnabled,
    onTestnetModeToggled,
    onPressSmartWallet,
    onPressStorage,
    handleTestnetModeToggle,
  }
}
