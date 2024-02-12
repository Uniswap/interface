import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { SharedEventName } from '@uniswap/analytics-events'
import { addScreenshotListener } from 'expo-screen-capture'
import React, { useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { HiddenMnemonicWordView } from 'src/components/mnemonic/HiddenMnemonicWordView'
import { MnemonicConfirmation } from 'src/components/mnemonic/MnemonicConfirmation'
import { MnemonicDisplay } from 'src/components/mnemonic/MnemonicDisplay'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { useLockScreenOnBlur } from 'src/features/authentication/lockScreenContext'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { ElementName, ManualPageViewScreen, ModalName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'
import { Button, Flex, Text, useMedia, useSporeColors } from 'ui/src'
import LockIcon from 'ui/src/assets/icons/lock.svg'
import { iconSizes } from 'ui/src/theme'
import {
  EditAccountAction,
  editAccountActions,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { BackupType, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.BackupManual>

enum View {
  SeedPhrase,
  SeedPhraseConfirm,
}

export function ManualBackupScreen({ navigation, route: { params } }: Props): JSX.Element | null {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const media = useMedia()

  useLockScreenOnBlur()

  const activeAccount = useActiveAccount()
  const mnemonicId = (activeAccount as SignerMnemonicAccount)?.mnemonicId

  const [showScreenShotWarningModal, setShowScreenShotWarningModal] = useState(false)
  const [view, nextView] = useReducer((curView: View) => curView + 1, View.SeedPhrase)

  const [continueButtonEnabled, setContinueButtonEnabled] = useState(false)
  const [continueButtonPressed, setContinueButtonPressed] = useState(false)

  // warning modal on seed phrase view
  const [seedWarningAcknowledged, setSeedWarningAcknowledged] = useState(false)

  const onValidationSuccessful = (): void => {
    if (activeAccount) {
      setContinueButtonPressed(true)
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
    if (view !== View.SeedPhrase) {
      return
    }

    const listener = addScreenshotListener(() => setShowScreenShotWarningModal(true))
    return () => listener?.remove()
  }, [view])

  useEffect(() => {
    if (continueButtonPressed && activeAccount?.backups?.includes(BackupType.Manual)) {
      navigation.navigate({ name: OnboardingScreens.Notifications, params, merge: true })
    }
  }, [continueButtonPressed, activeAccount?.backups, navigation, params])

  const responsiveTitle = media.short ? undefined : t('Confirm your recovery phrase')

  const responsiveSubtitle = media.short
    ? t('Confirm your recovery phrase') + '. ' + t('Select the missing words in order.')
    : t('Select the missing words in order.')

  // Manually log as page views as these screens are not captured in navigation events
  useEffect(() => {
    switch (view) {
      case View.SeedPhrase:
        sendMobileAnalyticsEvent(SharedEventName.PAGE_VIEWED, {
          screen: ManualPageViewScreen.WriteDownRecoveryPhrase,
        })
        break
      case View.SeedPhraseConfirm:
        sendMobileAnalyticsEvent(SharedEventName.PAGE_VIEWED, {
          screen: ManualPageViewScreen.ConfirmRecoveryPhrase,
        })
    }
  }, [view])

  switch (view) {
    case View.SeedPhrase:
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
            <Flex grow>
              {seedWarningAcknowledged ? (
                <MnemonicDisplay mnemonicId={mnemonicId} />
              ) : (
                <HiddenMnemonicWordView />
              )}
            </Flex>
            <Flex justifyContent="flex-end">
              <Button testID={ElementName.Next} onPress={nextView}>
                {t('Continue')}
              </Button>
            </Flex>
          </Flex>
          {!seedWarningAcknowledged && (
            <SeedWarningModal onPress={(): void => setSeedWarningAcknowledged(true)} />
          )}
        </OnboardingScreen>
      )
    case View.SeedPhraseConfirm:
      return (
        <OnboardingScreen subtitle={responsiveSubtitle} title={responsiveTitle}>
          <Flex grow pointerEvents={continueButtonEnabled ? 'none' : 'auto'} pt="$spacing12">
            <MnemonicConfirmation
              mnemonicId={mnemonicId}
              onConfirmComplete={(): void => setContinueButtonEnabled(true)}
            />
          </Flex>
          <Flex justifyContent="flex-end">
            <Button
              disabled={!continueButtonEnabled}
              testID={ElementName.Continue}
              onPress={onValidationSuccessful}>
              {t('Continue')}
            </Button>
          </Flex>
        </OnboardingScreen>
      )
  }

  return null
}

const SeedWarningModal = ({ onPress }: { onPress: () => void }): JSX.Element => {
  const colors = useSporeColors()
  const { t } = useTranslation()
  return (
    <BottomSheetModal
      backgroundColor={colors.surface1.get()}
      hideHandlebar={true}
      isDismissible={false}
      name={ModalName.SeedPhraseWarningModal}>
      <Flex centered gap="$spacing16" pb="$spacing24" pt="$spacing24" px="$spacing24">
        <Flex centered backgroundColor="$surface2" borderRadius="$rounded12" p="$spacing12">
          <LockIcon
            color={colors.neutral2.val}
            height={iconSizes.icon24}
            width={iconSizes.icon24}
          />
        </Flex>
        <Text color="$neutral1" variant="body1">
          {t('Do this step in a private place')}
        </Text>
        <Text color="$neutral2" textAlign="center" variant="body2">
          {t(
            'Your recovery phrase is what grants you (and anyone who has it) access to your funds. Be sure to store it in a safe place.'
          )}
        </Text>
        <TouchableOpacity hitSlop={24} onPress={onPress}>
          <Text color="$accent1" pt="$spacing24" variant="buttonLabel2">
            {t('Continue')}
          </Text>
        </TouchableOpacity>
      </Flex>
    </BottomSheetModal>
  )
}
