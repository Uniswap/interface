import { NavigationProp } from '@react-navigation/core'
import { Dispatch } from 'redux'
import { OnboardingStackBaseParams, OnboardingStackParamList } from 'src/app/navigation/types'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { restoreMnemonicComplete } from 'wallet/src/features/wallet/slice'

export function onRestoreComplete({
  isRestoringMnemonic,
  dispatch,
  params,
  navigation,
}: {
  isRestoringMnemonic: boolean
  dispatch: Dispatch
  params: OnboardingStackBaseParams
  navigation: NavigationProp<OnboardingStackParamList>
}): void {
  if (isRestoringMnemonic) {
    // restore flow is handled in saga after `restoreMnemonicComplete` is dispatched
    dispatch(restoreMnemonicComplete())
  } else {
    navigation.navigate({ name: OnboardingScreens.SelectWallet, params, merge: true })
  }
}
