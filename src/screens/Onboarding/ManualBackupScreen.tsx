import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { addScreenshotListener } from 'expo-screen-capture'
import React, { useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { ManualBackupEducationSection } from 'src/components/mnemonic/ManualBackupEducationSection'
import { MnemonicDisplay } from 'src/components/mnemonic/MnemonicDisplay'
import { MnemonicTest } from 'src/components/mnemonic/MnemonicTest'
import { WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { useLockScreenOnBlur } from 'src/features/authentication/lockScreenContext'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { BackupType, SignerMnemonicAccount } from 'src/features/wallet/accounts/types'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { OnboardingScreens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.BackupManual>

enum View {
  Education,
  View,
  Test,
}

export function ManualBackupScreen({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  useLockScreenOnBlur()

  const activeAccount = useActiveAccount()
  const mnemonicId = (activeAccount as SignerMnemonicAccount)?.mnemonicId

  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showScreenShotWarningModal, setShowScreenShotWarningModal] = useState(false)
  const [view, nextView] = useReducer((curView: View) => curView + 1, View.Education)

  const [continueButtonEnabled, setContinueButtonEnabled] = useState(false)

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
              'Uniswap Labs can’t restore lost recovery phrases. This is why it’s important to back up your recovery phrase.'
            )}
            closeText={t('Cancel')}
            confirmText={t('I understand')}
            isVisible={showTermsModal}
            modalName={ModalName.RecoveryWarning}
            severity={WarningSeverity.High}
            title={t('If you lose your recovery phrase, you’ll lose access to your assets')}
            onClose={() => setShowTermsModal(false)}
            onConfirm={nextView}
          />

          <Flex grow justifyContent="space-between" px="xs">
            <ManualBackupEducationSection />
            <Flex justifyContent="flex-end" width="100%">
              <Button
                label={t('Continue')}
                name={ElementName.Next}
                onPress={() => setShowTermsModal(true)}
              />
            </Flex>
          </Flex>
        </OnboardingScreen>
      )
    case View.View:
      return (
        <OnboardingScreen
          subtitle={t('Remember to record your words in the same order as they appear below.')}
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
              <Button label={t('Continue')} name={ElementName.Next} onPress={nextView} />
            </Flex>
          </Flex>
        </OnboardingScreen>
      )

    case View.Test:
      return (
        <OnboardingScreen
          subtitle={t(
            'Confirm that you correctly wrote down your recovery phrase. If your phrase is 12 words, select the missing words to continue.'
          )}
          title={t('Confirm your recovery phrase')}>
          <Flex grow>
            <MnemonicTest
              mnemonicId={mnemonicId}
              onTestComplete={() => setContinueButtonEnabled(true)}
            />
          </Flex>
          <Flex justifyContent="flex-end">
            <Button
              disabled={!continueButtonEnabled}
              label={t('Continue')}
              name={ElementName.Continue}
              onPress={onValidationSuccessful}
            />
          </Flex>
        </OnboardingScreen>
      )
  }

  return null
}
