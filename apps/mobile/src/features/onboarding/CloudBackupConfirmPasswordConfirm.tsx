import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, TextInput } from 'react-native'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { PasswordInput } from 'src/components/input/PasswordInput'
import { Flex } from 'src/components/layout'
import { PasswordErrors } from 'src/features/onboarding/CloudBackupSetPassword'
import { PasswordError } from 'src/features/onboarding/PasswordError'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'

export type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  OnboardingScreens.BackupCloudPasswordConfirm
>

export function CloudBackupPasswordConfirmScreen({
  navigation,
  route: { params },
}: Props): JSX.Element {
  const { t } = useTranslation()

  const { password } = params

  const confirmPasswordRef = useRef<TextInput>(null)

  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<PasswordErrors | undefined>(undefined)

  const isButtonDisabled = !!error || confirmPassword.length === 0

  const onConfirmPasswordChangeText = (newConfirmPassword: string): void => {
    if (newConfirmPassword === password) {
      setError(undefined)
    }
    setConfirmPassword(newConfirmPassword)
  }

  const onConfirmPasswordSubmitEditing = (): void => {
    if (confirmPassword !== password) {
      setError(PasswordErrors.PasswordsDoNotMatch)
      return
    }

    setError(undefined)
    Keyboard.dismiss()
  }

  const onPressNext = (): void => {
    if (confirmPassword !== password) {
      setError(PasswordErrors.PasswordsDoNotMatch)
      return
    }

    if (!error) {
      navigation.navigate({
        name: OnboardingScreens.BackupCloudProcessing,
        params: {
          ...params,
          password,
        },
        merge: true,
      })
    }
  }

  return (
    <SafeKeyboardOnboardingScreen
      subtitle={t("This is top-secret and all on you. Even we can't retrieve it, so keep it safe.")}
      title={t('Confirm your backup password')}>
      <Flex gap="spacing24" mb="spacing24" mx="spacing8">
        <Flex gap="spacing8">
          <PasswordInput
            ref={confirmPasswordRef}
            placeholder={t('Retype your password')}
            returnKeyType="next"
            value={confirmPassword}
            onChangeText={(newText: string): void => {
              setError(undefined)
              onConfirmPasswordChangeText(newText)
            }}
            onSubmitEditing={onConfirmPasswordSubmitEditing}
          />
          {error ? (
            <PasswordError
              errorText={
                error === PasswordErrors.InvalidPassword
                  ? t('Password must be at least 8 characters')
                  : t('Passwords do not match')
              }
            />
          ) : null}
        </Flex>
      </Flex>
      <Button
        disabled={isButtonDisabled}
        label={t('Continue')}
        name={ElementName.Next}
        onPress={onPressNext}
      />
    </SafeKeyboardOnboardingScreen>
  )
}
