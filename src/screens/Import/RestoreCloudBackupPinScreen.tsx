import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import PinInput from 'src/components/input/PinInput'
import { Box } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { PIN_LENGTH } from 'src/features/CloudBackup/cloudBackupSlice'
import { importAccountActions, IMPORT_WALLET_AMOUNT } from 'src/features/import/importAccountSaga'
import { ImportAccountType } from 'src/features/import/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { restoreMnemonicFromICloud } from 'src/lib/RNEthersRs'
import { OnboardingScreens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  OnboardingScreens.RestoreCloudBackupPin
>

export function RestoreCloudBackupPinScreen({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const [enteredPin, setEnteredPin] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (enteredPin.length !== PIN_LENGTH) return

    // Atttempt to restore backup with encrypted mnemonic using pin
    async function checkValidPin() {
      try {
        await restoreMnemonicFromICloud(params.mnemonicId, enteredPin)
        dispatch(
          importAccountActions.trigger({
            type: ImportAccountType.RestoreBackup,
            mnemonicId: params.mnemonicId,
            indexes: Array.from(Array(IMPORT_WALLET_AMOUNT).keys()),
          })
        )
        navigation.navigate({ name: OnboardingScreens.SelectWallet, params, merge: true })
      } catch (error) {
        const err = error as Error
        setErrorMessage(err.message)
      }
    }

    checkValidPin()
    setEnteredPin('')
  }, [dispatch, enteredPin, navigation, params])

  return (
    <OnboardingScreen
      subtitle={t('This PIN is required to recover your backed up recovery phrase from iCloud.')}
      title={t('Enter your iCloud backup PIN')}>
      <Box minHeight={30}>
        {errorMessage && (
          <Text color="accentFailure" textAlign="center" variant="body">
            {errorMessage}
          </Text>
        )}
      </Box>
      <PinInput
        length={PIN_LENGTH}
        setValue={(newValue: string) => {
          setErrorMessage(undefined)
          setEnteredPin(newValue)
        }}
        value={enteredPin}
      />
    </OnboardingScreen>
  )
}
