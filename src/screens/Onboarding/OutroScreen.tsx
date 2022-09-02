import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Screen } from 'src/components/layout/Screen'
import { OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { useActiveAccount } from 'src/features/wallet/hooks'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'src/features/wallet/pendingAcccountsSaga'
import { setFinishedOnboarding } from 'src/features/wallet/walletSlice'
import { OnboardingCompleteAnimation } from 'src/screens/Onboarding/OnboardingCompleteAnimation/OnboardingCompleteAnimation'
import { OnboardingScreens, Screens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.Outro>

export function OutroScreen({ navigation, route: { params } }: Props) {
  const dispatch = useAppDispatch()

  const activeAddress = useActiveAccount()?.address

  const onPressNext = () => {
    // Remove pending flag from all new accounts.
    dispatch(pendingAccountActions.trigger(PendingAccountActions.ACTIVATE))
    dispatch(setFinishedOnboarding({ finishedOnboarding: true }))
    if (params?.entryPoint === OnboardingEntryPoint.Sidebar) {
      navigation.navigate(Screens.Home)
    }
  }

  return (
    <Screen>
      <OnboardingCompleteAnimation activeAddress={activeAddress ?? ''} onPressNext={onPressNext} />
    </Screen>
  )
}
