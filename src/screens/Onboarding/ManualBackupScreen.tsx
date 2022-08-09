import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { addScreenshotListener } from 'expo-screen-capture'
import React, { useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { ManualBackupEducationSection } from 'src/components/mnemonic/ManualBackupEducationSection'
import { MnemonicDisplay } from 'src/components/mnemonic/MnemonicDisplay'
import WarningModal from 'src/components/modals/WarningModal'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { BackupType, NativeAccount } from 'src/features/wallet/accounts/types'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { OnboardingScreens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.BackupManual>

enum View {
  Education,
  View,
}

export function ManualBackupScreen({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const activeAccount = useActiveAccount()
  const mnemonicId = (activeAccount as NativeAccount)?.mnemonicId

  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showScreenShotWarningModal, setShowScreenShotWarningModal] = useState(false)
  const [view, nextView] = useReducer((curView: View) => curView + 1, View.Education)

  const onValidationSuccessful = () => {
    if (activeAccount) {
      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.AddBackupMethod,
          address: activeAccount.address,
          backupMethod: BackupType.Manual,
        })
      )
    }
  }

  useEffect(() => {
    if (view !== View.View) {
      return
    }

    const listener = addScreenshotListener(() => setShowScreenShotWarningModal(true))
    return () => listener?.remove()
  }, [view])

  useEffect(() => {
    if (activeAccount?.backups?.includes(BackupType.Manual)) {
      navigation.navigate({ name: OnboardingScreens.Backup, params, merge: true })
    }
  }, [activeAccount?.backups, navigation, params])

  switch (view) {
    case View.Education:
      return (
        <OnboardingScreen
          paddingTop="xs"
          subtitle={t('Keep the following steps in mind before backing up your recovery phrase:')}
          title={t('Back up manually')}>
          <WarningModal
            caption={t(
              'It’s up to you to backup your recovery phrase by storing it in a safe and memorable place.'
            )}
            closeText={t('Cancel')}
            confirmText={t('I understand')}
            isVisible={showTermsModal}
            modalName={ModalName.RecoveryWarning}
            title={t('If you lose your recovery phrase, Uniswap Labs can’t restore your wallet')}
            onClose={() => setShowTermsModal(false)}
            onConfirm={nextView}
          />

          <Flex grow justifyContent="space-between" px="xs">
            <ManualBackupEducationSection />
            <Flex justifyContent="flex-end" width="100%">
              <PrimaryButton
                label={t('Continue')}
                name={ElementName.Next}
                testID={ElementName.Next}
                textVariant="largeLabel"
                variant="onboard"
                onPress={() => setShowTermsModal(true)}
              />
            </Flex>
          </Flex>
        </OnboardingScreen>
      )
    case View.View:
      return (
        <OnboardingScreen
          subtitle={t('Remember to record your words in the same order as they are below.')}
          title={t('Write down your recovery phrase')}>
          <WarningModal
            caption={t(
              'Storing your recovery phrase as a screenshot is easy, but it allows anyone with access to your device access to your wallet. We encourage you to delete the screenshot and write down your recovery phrase instead.'
            )}
            confirmText={t('OK')}
            isVisible={showScreenShotWarningModal}
            modalName={ModalName.ScreenshotWarning}
            title={t('Screenshots aren’t secure')}
            onConfirm={() => setShowScreenShotWarningModal(false)}
          />
          <Flex grow justifyContent="space-between">
            <Flex mx="md">
              <MnemonicDisplay mnemonicId={mnemonicId} />
            </Flex>
            <Flex grow justifyContent="flex-end">
              <PrimaryButton
                label={t('Continue')}
                name={ElementName.Next}
                testID={ElementName.Next}
                textVariant="largeLabel"
                variant="onboard"
                onPress={onValidationSuccessful}
              />
            </Flex>
          </Flex>
        </OnboardingScreen>
      )
  }

  return null
}
