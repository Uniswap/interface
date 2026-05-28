import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { SeedPhraseDisplay } from 'src/components/mnemonic/SeedPhraseDisplay'
import { useLockScreenOnBlur } from 'src/features/lockScreen/hooks/useLockScreenOnBlur'
import { Text } from 'ui/src'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.OnDeviceRecoveryViewSeedPhrase>

export function OnDeviceRecoveryViewSeedPhraseScreen({
  navigation,
  route: {
    params: { mnemonicId },
  },
}: Props): JSX.Element {
  const { t } = useTranslation()

  const navigateBack = (): void => {
    navigation.goBack()
  }

  useLockScreenOnBlur()

  return (
    <Trace logImpression screen={OnboardingScreens.OnDeviceRecoveryViewSeedPhrase}>
      <Screen mb="$spacing12" mt="$spacing24">
        <BackHeader alignment="center" px="$spacing16">
          <Text variant="body1">{t('settings.setting.recoveryPhrase.title')}</Text>
        </BackHeader>
        <SeedPhraseDisplay mnemonicId={mnemonicId} onDismiss={navigateBack} />
      </Screen>
    </Trace>
  )
}
