import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import PinInput from 'src/components/input/PinInput'
import { Box } from 'src/components/layout'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { Text } from 'src/components/Text'
import { PIN_LENGTH } from 'src/features/CloudBackup/cloudBackupSlice'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'
type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.BackupCloud>

function isPinConfirmationValid(expected: string, actual: string) {
  return expected === actual
}

export function CloudBackupScreen({
  navigation,
  route: {
    params: { pin, importType },
  },
}: Props) {
  const { t } = useTranslation()

  const [enteredPin, setEnteredPin] = useState('')
  const [error, setError] = useState(false)
  const [showPinWarningModal, setShowPinWarningModal] = useState(false)

  // Add skip button on first pin form
  useEffect(() => {
    if (!pin) {
      navigation.setOptions({
        headerRight: () => (
          <Button
            name={ElementName.Skip}
            testID={ElementName.Skip}
            onPress={() => setShowPinWarningModal(true)}>
            <Text color="textSecondary" variant="smallLabel">
              {t('Skip')}
            </Text>
          </Button>
        ),
      })
    }
  }, [navigation, pin, t])

  // detects valid confirmation
  useEffect(() => {
    if (!pin) return
    if (enteredPin.length !== PIN_LENGTH) return

    if (isPinConfirmationValid(pin, enteredPin)) {
      navigation.navigate({
        name: OnboardingScreens.BackupCloudProcessing,
        params: {
          pin,
          importType,
        },
        merge: true,
      })
    } else {
      setEnteredPin('')
      setError(true)
    }
  }, [enteredPin, importType, navigation, pin])

  // detects user pin form complete
  useEffect(() => {
    if (pin) return
    if (enteredPin.length !== PIN_LENGTH) return

    setEnteredPin('')
    // push same screen with pin filled
    navigation.push(OnboardingScreens.BackupCloud, { pin: enteredPin, importType })
  }, [enteredPin, importType, navigation, pin])

  if (!pin) {
    return (
      <OnboardingScreen
        subtitle={t(
          'Setting a PIN will encrypt your seed phrase, making it harder for an attacker to steal your assets if they gain access to your iCloud.'
        )}
        title={t('Set your iCloud backup PIN')}>
        <PinInput length={PIN_LENGTH} setValue={setEnteredPin} value={enteredPin} />
        <WarningModal
          caption={t(
            'Your recovery phrase won’t be encrypted, meaning that anyone who gains access to your iCloud will be able to steal your assets.'
          )}
          closeText={t('Back')}
          confirmText={t('I understand')}
          isVisible={showPinWarningModal}
          modalName={ModalName.ICloudSkipPinWarning}
          title={t("It's risky to skip setting a PIN")}
          onClose={() => setShowPinWarningModal(false)}
          onConfirm={() => {
            setShowPinWarningModal(false)
            navigation.navigate({
              name: OnboardingScreens.BackupCloudProcessing,
              params: {
                pin: null,
                importType,
              },
              merge: true,
            })
          }}
        />
      </OnboardingScreen>
    )
  }

  return (
    <OnboardingScreen title={t('Confirm your iCloud backup PIN')}>
      {/* keep spacing consistent when no errors with minHeight */}
      <Box minHeight={30}>
        {error ? (
          <Text color="accentFailure" textAlign="center" variant="body">
            {t('Incorrect order. Please try again.')}
          </Text>
        ) : null}
      </Box>
      <PinInput
        length={PIN_LENGTH}
        setValue={(newValue: string) => {
          setError(false)
          setEnteredPin(newValue)
        }}
        value={enteredPin}
      />
    </OnboardingScreen>
  )
}
