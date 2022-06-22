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

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.RestoreWallet>

export function RestoreWalletScreen({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()

  const [enteredPin, setEnteredPin] = useState('')
  const [error, setError] = useState(false)

  /**
   * @TODO
   * 1. detect icloud pin and validate input against it
   * 2. load addresses for recovered wallets
   * 3. load wallets in low level RS code if succesful pin (accounts need to be imported)
   * 3. navigate to select wallet page with wallets ^ if succesful pin
   */
  const expectedPin = '00Dummy'
  useEffect(() => {
    if (enteredPin.length !== PIN_LENGTH) return
    if (enteredPin === expectedPin) {
      navigation.navigate({ name: OnboardingScreens.SelectWallet, params, merge: true })
    } else {
      setEnteredPin('')
      setError(true)
    }
  }, [enteredPin, navigation, params])

  return (
    <OnboardingScreen
      subtitle={t('This PIN is required to recover your backed up recovery phrase from iCloud.')}
      title={t('Enter your iCloud backup PIN')}>
      <Box minHeight={30}>
        {error ? (
          <Text color="deprecated_red" textAlign="center" variant="body1">
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
