import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { CloudBackupPassword } from 'src/features/CloudBackup/CloudBackupForm'
import { BackupSpeedBumpModal } from 'src/features/onboarding/BackupSpeedBumpModal'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { Flex } from 'ui/src'
import { Experiments, OnboardingRedesignRecoveryBackupProperties } from 'uniswap/src/features/gating/experiments'
import { useExperimentValue } from 'uniswap/src/features/gating/hooks'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'

export type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.BackupCloudPasswordConfirm>

export function CloudBackupPasswordConfirmScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()

  const { password } = params

  const [showSpeedBumpModal, setShowSpeedBumpModal] = useState(false)

  const onboardingExperimentEnabled = useExperimentValue(
    Experiments.OnboardingRedesignRecoveryBackup,
    OnboardingRedesignRecoveryBackupProperties.Enabled,
    false,
  )

  const navigateToNextScreen = useCallback((): void => {
    navigation.navigate({
      name: OnboardingScreens.BackupCloudProcessing,
      params,
      merge: true,
    })
  }, [navigation, params])

  return (
    <CloudBackupPassword.FormProvider
      isConfirmation
      checkPasswordBeforeSubmit={onboardingExperimentEnabled}
      navigateToNextScreen={navigateToNextScreen}
      passwordToConfirm={password}
    >
      <SafeKeyboardOnboardingScreen
        footer={
          <Flex mx="$spacing16" my="$spacing12">
            <CloudBackupPassword.ContinueButton
              onPressContinue={onboardingExperimentEnabled ? (): void => setShowSpeedBumpModal(true) : undefined}
            />
          </Flex>
        }
        subtitle={t('onboarding.cloud.confirm.description')}
        title={t('onboarding.cloud.confirm.title')}
      >
        <CloudBackupPassword.PasswordInput />

        {onboardingExperimentEnabled && showSpeedBumpModal && (
          <BackupSpeedBumpModal
            backupType={BackupType.Cloud}
            onClose={() => setShowSpeedBumpModal(false)}
            onContinue={navigateToNextScreen}
          />
        )}
      </SafeKeyboardOnboardingScreen>
    </CloudBackupPassword.FormProvider>
  )
}
