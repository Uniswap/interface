import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { SlideInRight, SlideOutLeft } from 'react-native-reanimated'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { SettingsStackParamList } from 'src/app/navigation/types'
import CloudIcon from 'src/assets/icons/cloud.svg'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import PinInput from 'src/components/input/PinInput'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { Text } from 'src/components/Text'
import { PIN_LENGTH } from 'src/features/CloudBackup/cloudBackupSlice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { BackupType, SignerMnemonicAccount } from 'src/features/wallet/accounts/types'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useAccounts } from 'src/features/wallet/hooks'
import { backupMnemonicToICloud } from 'src/lib/RNEthersRs'
import { Screens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<SettingsStackParamList, Screens.SettingsCloudBackupScreen>

enum ViewStep {
  EnterPin,
  ConfirmPin,
}

// This screen is visited when no iCloud backup exists (checked from settings)
export function SettingsCloudBackupScreen({
  navigation,
  route: {
    params: { address },
  },
}: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()

  const accounts = useAccounts()
  const accountBackups = accounts[address]?.backups

  const [currentStep, nextStep] = useReducer((step: ViewStep) => step + 1, ViewStep.EnterPin)

  const [pin, setPin] = useState('')

  const backup = useCallback(async () => {
    try {
      const mnemonicId = (accounts[address] as SignerMnemonicAccount)?.mnemonicId
      if (!mnemonicId) return

      await backupMnemonicToICloud(mnemonicId, pin ?? '')
      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.AddBackupMethod,
          address: address,
          backupMethod: BackupType.Cloud,
        })
      )
    } catch (error) {
      Alert.alert(
        t('iCloud error'),
        t(
          'Unable to backup recovery phrase to iCloud. Please ensure you have iCloud enabled with available storage space and try again.'
        ),
        [
          {
            text: t('OK'),
            style: 'default',
          },
        ]
      )
      navigation.goBack()
    }
  }, [accounts, address, pin, dispatch, t, navigation])

  useEffect(() => {
    if (accountBackups?.includes(BackupType.Cloud)) {
      navigation.replace(Screens.SettingsCloudBackupStatus, { address })
    }
  }, [accountBackups, address, navigation])

  switch (currentStep) {
    case ViewStep.EnterPin: {
      return (
        <Screen mx="lg" pt="md">
          <EnterPinView />
        </Screen>
      )
    }
    case ViewStep.ConfirmPin:
      return (
        <Screen mx="lg" pt="md">
          <ConfirmPinView />
        </Screen>
      )
  }

  return null

  function EnterPinView() {
    const [showCloudBackupInfoModal, setShowCloudBackupInfoModal] = useState(true)
    const [showPinWarningModal, setShowPinWarningModal] = useState(false)

    const [enteredPin, setEnteredPin] = useState('')
    useEffect(() => {
      if (enteredPin.length !== PIN_LENGTH) return

      setPin(enteredPin)
      setEnteredPin('')
      nextStep()
    }, [enteredPin])

    // cleanup
    useEffect(() => {
      return () => setShowCloudBackupInfoModal(false)
    }, [])

    return (
      <>
        <AnimatedFlex grow alignItems="stretch" entering={SlideInRight} exiting={SlideOutLeft}>
          <Flex row alignItems="center" justifyContent="space-between" mb="md">
            <BackHeader alignment="center" />
            <Button
              name={ElementName.Skip}
              testID={ElementName.Skip}
              onPress={() => {
                setShowPinWarningModal(true)
              }}>
              <Text color="textSecondary" variant="buttonLabelSmall">
                {t('Skip')}
              </Text>
            </Button>
          </Flex>
          <Flex alignItems="center" justifyContent="space-between" mx="md">
            <Text variant="headlineSmall">{t('Back up to iCloud')}</Text>
            <Text color="textSecondary" textAlign="center" variant="bodySmall">
              {t(
                'You can set an optional iCloud backup PIN. If you choose to do so, you’ll have to enter it when restoring your wallet from iCloud. '
              )}
            </Text>
          </Flex>
          <Flex grow>
            <PinInput length={PIN_LENGTH} setValue={setEnteredPin} value={enteredPin} />
          </Flex>
        </AnimatedFlex>
        <BottomSheetModal
          backgroundColor={theme.colors.backgroundSurface}
          isVisible={showCloudBackupInfoModal}
          name={ModalName.ICloudBackupInfo}
          onClose={() => setShowCloudBackupInfoModal(false)}>
          <Flex gap="none" mb="xl" px="md" py="sm">
            <Flex centered gap="md">
              <Box borderColor="accentAction" borderRadius="md" borderWidth={1} padding="sm">
                <CloudIcon color={theme.colors.accentAction} />
              </Box>
              <Text textAlign="center" variant="buttonLabelMedium">
                {t('Back up recovery phrase to iCloud?')}
              </Text>
              <Text color="textSecondary" textAlign="center" variant="bodySmall">
                {t(
                  'It looks like you haven’t backed up your recovery phrase to iCloud yet. By doing so, you can recover your wallet just by being logged into iCloud on any device.'
                )}
              </Text>
            </Flex>
            <Flex alignItems="stretch" gap="sm" paddingTop="lg">
              <PrimaryButton
                borderRadius="md"
                label={t('Go back')}
                variant="transparent"
                width="100%"
                onPress={() => navigation.goBack()}
              />
              <PrimaryButton
                borderRadius="md"
                label={t('Back up to iCloud')}
                name={ElementName.Confirm}
                testID={ElementName.Confirm}
                variant="blue"
                onPress={() => setShowCloudBackupInfoModal(false)}
              />
            </Flex>
          </Flex>
        </BottomSheetModal>
        <WarningModal
          caption={t(
            'Without a PIN, your recovery phrase won’t be encrypted, meaning that anyone who gains access to your iCloud will be able to steal your assets.'
          )}
          closeText={t('Back')}
          confirmText={t('I understand')}
          isVisible={showPinWarningModal}
          modalName={ModalName.ICloudSkipPinWarning}
          title={t('Your iCloud backup is at risk')}
          onClose={() => setShowPinWarningModal(false)}
          onConfirm={() => {
            setShowPinWarningModal(false)
            backup()
          }}
        />
      </>
    )
  }

  function ConfirmPinView() {
    const [enteredConfirmationPin, setEnteredConfirmationPin] = useState('')
    const [error, setError] = useState(false)

    // detects valid confirmation
    useEffect(() => {
      if (!pin) return
      if (enteredConfirmationPin.length !== PIN_LENGTH) return

      if (pin === enteredConfirmationPin) {
        backup()
        setEnteredConfirmationPin('')
      } else {
        setEnteredConfirmationPin('')
        setError(true)
      }
    }, [enteredConfirmationPin])

    return (
      <>
        <AnimatedFlex grow alignItems="stretch" entering={SlideInRight} exiting={SlideOutLeft}>
          <BackHeader alignment="center" mb="md" />
          <Flex alignItems="center" justifyContent="space-between" mx="md" pb="sm">
            <Text variant="headlineSmall">{t('Confirm iCloud backup PIN')}</Text>
            {error ? (
              <Text color="accentFailure" pb="md" textAlign="center" variant="bodySmall">
                {t('This PIN doesn’t match the one you set. Please try again.')}
              </Text>
            ) : (
              <Text color="textSecondary" textAlign="center" variant="bodySmall">
                {t('Retype your PIN to confirm that you have remembered it correctly.')}
              </Text>
            )}
          </Flex>

          <Flex grow>
            <PinInput
              length={PIN_LENGTH}
              setValue={(newValue: string) => {
                setError(false)
                setEnteredConfirmationPin(newValue)
              }}
              value={enteredConfirmationPin}
            />
          </Flex>
        </AnimatedFlex>
      </>
    )
  }
}
