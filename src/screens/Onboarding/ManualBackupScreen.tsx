import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { addScreenshotListener } from 'expo-screen-capture'
import React, { useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { CheckBox } from 'src/components/buttons/CheckBox'
import { Flex } from 'src/components/layout'
import { ManualBackupEducationSection } from 'src/components/mnemonic/ManualBackupEducationSection'
import { MnemonicDisplay } from 'src/components/mnemonic/MnemonicDisplay'
import { MnemonicTest } from 'src/components/mnemonic/MnemonicTest'
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

export function ManualBackupScreen({ navigation, route: { params } }: Props): JSX.Element | null {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  useLockScreenOnBlur()

  const activeAccount = useActiveAccount()
  const mnemonicId = (activeAccount as SignerMnemonicAccount)?.mnemonicId

  const [hasConsent, setHasConsent] = useState(false)
  const [showScreenShotWarningModal, setShowScreenShotWarningModal] = useState(false)
  const [view, nextView] = useReducer((curView: View) => curView + 1, View.Education)

  const [continueButtonEnabled, setContinueButtonEnabled] = useState(false)

  const onValidationSuccessful = (): void => {
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
          paddingTop="spacing8"
          title={t('Instructions for backing up your recovery phrase')}>
          <ManualBackupEducationSection />
          <Flex justifyContent="flex-end">
            <CheckBox
              checked={hasConsent}
              text={t(
                'I understand that if I lose my recovery phrase, Uniswap Labs cannot restore it.'
              )}
              onCheckPressed={(): void => setHasConsent(!hasConsent)}
            />
            <Button
              disabled={!hasConsent}
              label={t('Continue')}
              name={ElementName.Next}
              onPress={nextView}
            />
          </Flex>
        </OnboardingScreen>
      )
    case View.View:
      return (
        <OnboardingScreen
          subtitle={t('Remember to record your words in the same order as they appear below.')}
          title={t('Write down your recovery phrase in order')}>
          {showScreenShotWarningModal && (
            <WarningModal
              caption={t(
                'Anyone who gains access to your photos can access your wallet. We recommend that you write down your words instead.'
              )}
              confirmText={t('OK')}
              modalName={ModalName.ScreenshotWarning}
              title={t('Screenshots aren’t secure')}
              onConfirm={(): void => setShowScreenShotWarningModal(false)}
            />
          )}
          <Flex grow justifyContent="space-between">
            <Flex mx="spacing16">
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
          subtitle={t('Select the missing words in order.')}
          title={t('Confirm your recovery phrase')}>
          <Flex grow>
            <MnemonicTest
              mnemonicId={mnemonicId}
              onTestComplete={(): void => setContinueButtonEnabled(true)}
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
