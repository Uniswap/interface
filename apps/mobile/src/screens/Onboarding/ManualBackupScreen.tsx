import { useFocusEffect } from '@react-navigation/core'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { SharedEventName } from '@uniswap/analytics-events'
import { addScreenshotListener } from 'expo-screen-capture'
import React, { useCallback, useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { MnemonicConfirmation } from 'src/components/mnemonic/MnemonicConfirmation'
import { MnemonicDisplay } from 'src/components/mnemonic/MnemonicDisplay'
import { useLockScreenOnBlur } from 'src/features/lockScreen/hooks/useLockScreenOnBlur'
import { BackupSpeedBumpModal } from 'src/features/onboarding/BackupSpeedBumpModal'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { Button, Flex, Text, useMedia, useSporeColors } from 'ui/src'
import { EyeSlash, FileListLock, GraduationCap, Key, Lock, PapersText, Pen } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { ManualPageViewScreen, MobileScreens, OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { EditAccountAction, editAccountActions } from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import { hasBackup } from 'wallet/src/features/wallet/accounts/utils'
import { useSignerAccount } from 'wallet/src/features/wallet/hooks'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.BackupManual>

enum View {
  SeedPhrase = 0,
  SeedPhraseConfirm = 1,
}

export function ManualBackupScreen({ navigation, route: { params } }: Props): JSX.Element | null {
  const { t } = useTranslation()
  const media = useMedia()
  const dispatch = useDispatch()

  const { getOnboardingOrImportedAccount, addBackupMethod } = useOnboardingContext()
  const onboardingContextAccount = getOnboardingOrImportedAccount()
  const activeAccount = useSignerAccount(params.address)

  const { entryPoint, fromCloudBackup } = params
  const onboardingExperimentEnabled = entryPoint === OnboardingEntryPoint.BackupCard

  const account = activeAccount || onboardingContextAccount

  useLockScreenOnBlur()

  if (!account) {
    throw Error('No account available for manual backup')
  }

  const mnemonicId = account.mnemonicId

  const [showSpeedBumpModal, setShowSpeedBumpModal] = useState(false)

  const [view, nextView] = useReducer((curView: View) => curView + 1, View.SeedPhrase)

  const [confirmContinueButtonEnabled, setConfirmContinueButtonEnabled] = useState(false)
  const [confirmContinueButtonPressed, setConfirmContinueButtonPressed] = useState(false)
  const [displayContinueButtonEnabled, setDisplayContinueButtonEnabled] = useState(!onboardingExperimentEnabled)

  // warning modal on seed phrase view
  const [seedWarningAcknowledged, setSeedWarningAcknowledged] = useState(fromCloudBackup ?? false)

  const onValidationSuccessful = (): void => {
    setConfirmContinueButtonPressed(true)
    if (activeAccount) {
      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.AddBackupMethod,
          address: activeAccount.address,
          backupMethod: BackupType.Manual,
        }),
      )
    } else {
      addBackupMethod(BackupType.Manual)
    }
  }

  const finishCloudBackup = (): void => {
    navigate(MobileScreens.Home)
  }

  useFocusEffect(
    useCallback(() => {
      if (view !== View.SeedPhrase) {
        return undefined
      }

      const listener = addScreenshotListener(() => {
        navigate(ModalName.ScreenshotWarning, { acknowledgeText: t('common.button.ok') })
      })
      return () => listener.remove()
    }, [view, t]),
  )

  useEffect(() => {
    if (confirmContinueButtonPressed && hasBackup(BackupType.Manual, account)) {
      if (params.entryPoint === OnboardingEntryPoint.BackupCard) {
        navigate(MobileScreens.Home)
      } else {
        navigation.replace(OnboardingScreens.Notifications, params)
      }
    }
  }, [confirmContinueButtonPressed, navigation, params, account])

  // Manually log as page views as these screens are not captured in navigation events
  useEffect(() => {
    switch (view) {
      case View.SeedPhrase:
        sendAnalyticsEvent(SharedEventName.PAGE_VIEWED, {
          screen: ManualPageViewScreen.WriteDownRecoveryPhrase,
        })
        break
      case View.SeedPhraseConfirm:
        sendAnalyticsEvent(SharedEventName.PAGE_VIEWED, {
          screen: ManualPageViewScreen.ConfirmRecoveryPhrase,
        })
    }
  }, [view])

  switch (view) {
    case View.SeedPhrase:
      return (
        <OnboardingScreen
          disableGoBack={fromCloudBackup}
          Icon={PapersText}
          subtitle={t('onboarding.recoveryPhrase.view.subtitle')}
          title={
            fromCloudBackup
              ? t('onboarding.recoveryPhrase.view.title.hasPassword')
              : t('onboarding.recoveryPhrase.view.title')
          }
        >
          <Flex grow justifyContent="space-between">
            <Flex grow>
              <MnemonicDisplay
                enableRevealButton={onboardingExperimentEnabled}
                mnemonicId={mnemonicId}
                showMnemonic={seedWarningAcknowledged}
                onMnemonicShown={() => {
                  setDisplayContinueButtonEnabled(true)
                }}
              />
            </Flex>
            <Flex justifyContent="flex-end">
              <Flex row>
                <Button
                  size="large"
                  variant="branded"
                  isDisabled={!displayContinueButtonEnabled}
                  testID={TestID.Next}
                  onPress={fromCloudBackup ? finishCloudBackup : nextView}
                >
                  {fromCloudBackup ? t('common.button.finish') : t('common.button.continue')}
                </Button>
              </Flex>
            </Flex>
          </Flex>
          {!seedWarningAcknowledged &&
            (onboardingExperimentEnabled ? (
              <ManualBackWarningModal onBack={navigation.goBack} onContinue={() => setSeedWarningAcknowledged(true)} />
            ) : (
              <SeedWarningModal onPress={(): void => setSeedWarningAcknowledged(true)} />
            ))}
        </OnboardingScreen>
      )
    case View.SeedPhraseConfirm:
      return (
        <OnboardingScreen
          Icon={GraduationCap}
          subtitle={
            media.short
              ? t('onboarding.recoveryPhrase.confirm.subtitle.combined')
              : t('onboarding.recoveryPhrase.confirm.subtitle.default')
          }
          title={media.short ? undefined : t('onboarding.recoveryPhrase.confirm.title')}
        >
          <Flex grow justifyContent="space-between">
            <Flex grow pointerEvents={confirmContinueButtonEnabled ? 'none' : 'auto'} pt="$spacing12">
              <MnemonicConfirmation
                mnemonicId={mnemonicId}
                onConfirmComplete={(): void => setConfirmContinueButtonEnabled(true)}
              />
            </Flex>
            <Trace logPress element={ElementName.Continue} screen={ManualPageViewScreen.ConfirmRecoveryPhrase}>
              <Flex row>
                <Button
                  isDisabled={!confirmContinueButtonEnabled}
                  size="large"
                  variant="branded"
                  testID={TestID.Continue}
                  onPress={() => (onboardingExperimentEnabled ? setShowSpeedBumpModal(true) : onValidationSuccessful())}
                >
                  {t('common.button.continue')}
                </Button>
              </Flex>
            </Trace>
          </Flex>

          {showSpeedBumpModal && (
            <BackupSpeedBumpModal
              backupType={BackupType.Manual}
              onClose={(): void => setShowSpeedBumpModal(false)}
              onContinue={onValidationSuccessful}
            />
          )}
        </OnboardingScreen>
      )
  }

  return null
}

const SeedWarningModal = ({ onPress }: { onPress: () => void }): JSX.Element => {
  const colors = useSporeColors()
  const { t } = useTranslation()
  return (
    <Modal
      backgroundColor={colors.surface1.val}
      hideHandlebar={true}
      isDismissible={false}
      name={ModalName.SeedPhraseWarningModal}
    >
      <Flex centered gap="$spacing16" pb="$spacing24" pt="$spacing24" px="$spacing24">
        <Flex centered backgroundColor="$surface2" borderRadius="$rounded12" p="$spacing12">
          <Lock color="$neutral1" size="$icon.24" />
        </Flex>
        <Text color="$neutral1" variant="body1">
          {t('onboarding.recoveryPhrase.warning.final.title')}
        </Text>
        <Text color="$neutral2" textAlign="center" variant="body2">
          {t('onboarding.recoveryPhrase.warning.final.message')}
        </Text>
        <Flex row mt="$spacing16">
          <Button size="large" testID={TestID.Confirm} variant="branded" onPress={onPress}>
            {t('onboarding.recoveryPhrase.warning.final.button')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}

type ManualBackWarningModalProps = {
  onBack: () => void
  onContinue: () => void
}
function ManualBackWarningModal({ onBack, onContinue }: ManualBackWarningModalProps): JSX.Element {
  const { t } = useTranslation()

  const rows = [
    { Icon: Key, text: t('onboarding.backup.manual.displayWarning.note.access') },
    { Icon: Pen, text: t('onboarding.backup.manual.displayWarning.note.storage') },
    { Icon: EyeSlash, text: t('onboarding.backup.manual.displayWarning.note.secure') },
  ]

  return (
    <Modal isDismissible={false} name={ModalName.SeedPhraseWarningModal}>
      <Flex alignContent="stretch" gap="$spacing12" px="$spacing24" py="$spacing12">
        <Flex centered>
          <Flex backgroundColor="$surface2" borderRadius="$rounded12" p="$spacing12">
            <FileListLock color="$neutral1" size="$icon.24" />
          </Flex>
        </Flex>

        <Flex centered gap="$spacing4" pt="$spacing4">
          <Text color="$neutral1" variant="subheading1">
            {t('onboarding.backup.manual.displayWarning.title')}
          </Text>
          <Text color="$neutral2" variant="body3">
            {t('onboarding.backup.manual.displayWarning.description')}
          </Text>
        </Flex>

        <Flex
          backgroundColor="$surface1"
          borderColor="$surface3"
          borderRadius="$rounded20"
          borderWidth="$spacing1"
          gap="$spacing20"
          p="$spacing16"
        >
          {rows.map((row, index) => (
            <Flex key={index} row alignItems="center" gap="$spacing12">
              <Flex
                centered
                backgroundColor="$statusCritical2"
                borderRadius="$roundedFull"
                height={iconSizes.icon32}
                width={iconSizes.icon32}
              >
                <row.Icon color="$statusCritical" size="$icon.16" />
              </Flex>
              <Text color="$neutral1" flexGrow={1} flexShrink={1} variant="body3">
                {row.text}
              </Text>
            </Flex>
          ))}
        </Flex>

        <Flex row gap="$spacing8">
          <Trace logPress element={ElementName.BackButton} modal={ModalName.SeedPhraseWarningModal}>
            <Button size="large" emphasis="secondary" onPress={() => onBack()}>
              {t('common.button.back')}
            </Button>
          </Trace>
          <Trace logPress element={ElementName.Continue} modal={ModalName.SeedPhraseWarningModal}>
            <Button size="large" variant="branded" emphasis="primary" onPress={() => onContinue()}>
              {t('common.button.continue')}
            </Button>
          </Trace>
        </Flex>
      </Flex>
    </Modal>
  )
}
