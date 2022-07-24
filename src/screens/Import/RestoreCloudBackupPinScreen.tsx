import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import PinInput from 'src/components/input/PinInput'
import { Box } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OnboardingScreens } from 'src/screens/Screens'

const PIN_LENGTH = 6

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  OnboardingScreens.RestoreCloudBackupPin
>

export function RestoreCloudBackupPinScreen({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()

  const [enteredPin, setEnteredPin] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (enteredPin.length !== PIN_LENGTH) return

    // TODO: Call native function to determine if pin successfully decrypts backup
    // TODO: Dispatch importAccountActions with ImportAcountType.Restore to load mnemonic from backup using pin

    setEnteredPin('')
    setError(true)
  }, [enteredPin, navigation, params])

  return (
    <OnboardingScreen
      subtitle={t('This PIN is required to recover your backed up recovery phrase from iCloud.')}
      title={t('Enter your iCloud backup PIN')}>
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
