import { NavigationProp } from '@react-navigation/core'
import { Dispatch } from 'redux'
import { OnboardingStackBaseParams, OnboardingStackParamList } from 'src/app/navigation/types'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { setHasCopiedPrivateKeys } from 'wallet/src/features/behaviorHistory/slice'
import { restoreMnemonicComplete } from 'wallet/src/features/wallet/slice'

/**
 * Helper to handle the completion of a restore flow. Manages the navigation and analytics
 * as well as any side effects that need to be run after the restore is complete.
 *
 * @param isRestoringMnemonic - Whether the restore is a mnemonic restore.
 * @param screen - The screen used to restore.
 */
export function onRestoreComplete({
  isRestoringMnemonic,
  dispatch,
  params,
  navigation,
  screen,
}: {
  isRestoringMnemonic: boolean
  dispatch: Dispatch
  params: OnboardingStackBaseParams
  navigation: NavigationProp<OnboardingStackParamList>
  screen: OnboardingScreens
}): void {
  if (isRestoringMnemonic) {
    // restore flow is handled in saga after `restoreMnemonicComplete` is dispatched
    dispatch(restoreMnemonicComplete())
    dispatch(setHasCopiedPrivateKeys(false))
  } else {
    navigation.navigate({ name: OnboardingScreens.SelectWallet, params, merge: true })
  }

  sendAnalyticsEvent(MobileEventName.RestoreSuccess, {
    is_restoring_mnemonic: isRestoringMnemonic,
    import_type: params.importType,
    restore_type: params.restoreType,
    screen,
  })
}
