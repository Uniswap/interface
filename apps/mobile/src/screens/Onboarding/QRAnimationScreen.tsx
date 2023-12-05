import { CompositeScreenProps } from '@react-navigation/core'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { AppStackParamList, OnboardingStackParamList } from 'src/app/navigation/types'
import { Screen } from 'src/components/layout/Screen'
import { QRAnimation } from 'src/screens/Onboarding/QRAnimation/QRAnimation'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import { ImportType } from 'wallet/src/features/onboarding/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

type Props = CompositeScreenProps<
  NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.QRAnimation>,
  NativeStackScreenProps<AppStackParamList, Screens.Home, undefined>
>

export function QRAnimationScreen({ navigation, route: { params } }: Props): JSX.Element {
  const activeAddress = useActiveAccountAddressWithThrow()

  const onPressNext = (): void => {
    navigation.navigate({
      name:
        params?.importType === ImportType.CreateNew
          ? OnboardingScreens.Backup
          : OnboardingScreens.Notifications,
      merge: true,
      params,
    })
  }

  return (
    <Screen>
      <QRAnimation
        activeAddress={activeAddress}
        isNewWallet={params?.importType === ImportType.CreateNew}
        onPressNext={onPressNext}
      />
    </Screen>
  )
}
