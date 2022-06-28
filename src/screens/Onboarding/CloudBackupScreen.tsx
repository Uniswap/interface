import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import PinInput from 'src/components/input/PinInput'
import { Box } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OnboardingScreens } from 'src/screens/Screens'
type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.BackupCloud>

const PIN_LENGTH = 6

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

  // detects valid confirmation
  useEffect(() => {
    if (!pin) return
    if (enteredPin.length !== PIN_LENGTH) return

    if (isPinConfirmationValid(pin, enteredPin)) {
      navigation.navigate({
        name: OnboardingScreens.BackupCloudProcessing,
        params: {
          pin,
          type: 'backup',
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

    // push same screen with pin filled
    navigation.push(OnboardingScreens.BackupCloud, { pin: enteredPin, importType })
  }, [enteredPin, importType, navigation, pin])

  if (!pin) {
    return (
      <OnboardingScreen
        subtitle={t('You’ll use this PIN to restore your wallet from iCloud.')}
        title={t('Set your iCloud backup PIN')}>
        <PinInput length={PIN_LENGTH} setValue={setEnteredPin} value={enteredPin} />
      </OnboardingScreen>
    )
  }

  return (
    <OnboardingScreen title={t('Confirm your iCloud backup PIN')}>
      {/* keep spacing consistent when no errors with minHeight */}
      <Box minHeight={30}>
        {error ? (
          <Text color="deprecated_red" textAlign="center" variant="body">
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
