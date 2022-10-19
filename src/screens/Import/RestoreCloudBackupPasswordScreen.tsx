import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { PasswordInput } from 'src/components/input/PasswordInput'
import { Flex } from 'src/components/layout/Flex'
import { restoreMnemonicFromICloud } from 'src/features/CloudBackup/RNICloudBackupsManager'
import { importAccountActions, IMPORT_WALLET_AMOUNT } from 'src/features/import/importAccountSaga'
import { ImportAccountType } from 'src/features/import/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { PasswordError } from 'src/features/onboarding/PasswordError'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'
import { colors } from 'src/styles/color'
import { ONE_MINUTE_MS } from 'src/utils/time'

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  OnboardingScreens.RestoreCloudBackupPassword
>

const MAX_WRONG_ATTEMPTS = 3
const RETRY_DELAY = ONE_MINUTE_MS * 2

export function RestoreCloudBackupPasswordScreen({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const [enteredPassword, setEnteredPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

  const [wrongAttemptCount, setWrongAttemptCount] = useState(0)

  const isTemporaryDisabled = wrongAttemptCount === MAX_WRONG_ATTEMPTS

  useEffect(() => {
    if (isTemporaryDisabled) {
      setErrorMessage(
        t('You have entered the incorrect password too many times. Please try again in 2 minutes.')
      )
      setTimeout(() => {
        setWrongAttemptCount(0)
        setErrorMessage(undefined)
      }, RETRY_DELAY)
    }
  }, [isTemporaryDisabled, t])

  const onPasswordSubmit = () => {
    if (isTemporaryDisabled || enteredPassword.length === 0) return

    // Atttempt to restore backup with encrypted mnemonic using password
    async function checkCorrectPassword() {
      try {
        await restoreMnemonicFromICloud(params.mnemonicId, enteredPassword)
        dispatch(
          importAccountActions.trigger({
            type: ImportAccountType.RestoreBackup,
            mnemonicId: params.mnemonicId,
            indexes: Array.from(Array(IMPORT_WALLET_AMOUNT).keys()),
          })
        )
        navigation.navigate({ name: OnboardingScreens.SelectWallet, params, merge: true })
      } catch (error) {
        setErrorMessage(t('Invalid password. Please try again.'))
        setWrongAttemptCount((prev) => prev + 1)
      }
    }

    checkCorrectPassword()
    setEnteredPassword('')
    Keyboard.dismiss()
  }

  const onContinuePress = () => {
    onPasswordSubmit()
  }

  return (
    <OnboardingScreen
      subtitle={
        !isTemporaryDisabled
          ? t('This password is required to recover your recovery phrase backup from iCloud.')
          : undefined
      }
      title={
        isTemporaryDisabled
          ? t('Attempts temporarily disabled')
          : t('Enter your iCloud backup password')
      }>
      <Flex>
        <PasswordInput
          editable={!isTemporaryDisabled}
          placeholder={t('Enter password')}
          value={enteredPassword}
          onChangeText={(newValue: string) => {
            if (!isTemporaryDisabled) {
              setErrorMessage(undefined)
            }
            setEnteredPassword(newValue)
          }}
          onSubmitEditing={onPasswordSubmit}
        />
        {errorMessage && <PasswordError errorText={errorMessage} />}
      </Flex>
      <PrimaryButton
        disabled={!enteredPassword || isTemporaryDisabled}
        label={t('Continue')}
        name={ElementName.Submit}
        style={{ backgroundColor: colors.magenta300 }}
        testID={ElementName.Submit}
        variant="onboard"
        onPress={onContinuePress}
      />
    </OnboardingScreen>
  )
}
