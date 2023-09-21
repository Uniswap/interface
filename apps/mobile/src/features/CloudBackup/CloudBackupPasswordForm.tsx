import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, TextInput } from 'react-native'
import { CheckBox } from 'src/components/buttons/CheckBox'
import { PasswordInput } from 'src/components/input/PasswordInput'
import { PasswordError } from 'src/features/onboarding/PasswordError'
import { ElementName } from 'src/features/telemetry/constants'
import { Button, Flex } from 'ui/src'
import { validatePassword } from 'wallet/src/utils/password'

export enum PasswordErrors {
  InvalidPassword = 'InvalidPassword',
  PasswordsDoNotMatch = 'PasswordsDoNotMatch',
}

export type CloudBackupPasswordProps = {
  navigateToNextScreen: ({ password }: { password: string }) => void
  isConfirmation?: boolean
  passwordToConfirm?: string
}

export function CloudBackupPasswordForm({
  navigateToNextScreen,
  isConfirmation,
  passwordToConfirm,
}: CloudBackupPasswordProps): JSX.Element {
  const { t } = useTranslation()

  const passwordInputRef = useRef<TextInput>(null)
  const [password, setPassword] = useState('')

  const [consentChecked, setConsentChecked] = useState(false)
  const [error, setError] = useState<PasswordErrors | undefined>(undefined)

  const isButtonDisabled = (!isConfirmation && !consentChecked) || !!error || password.length === 0

  const onPasswordChangeText = (newPassword: string): void => {
    if (isConfirmation && newPassword === password) {
      setError(undefined)
    }
    // always reset error if not confirmation
    if (!isConfirmation) {
      setError(undefined)
    }
    setPassword(newPassword)
  }

  const onPressConsent = (): void => {
    setConsentChecked(!consentChecked)
  }

  const onPasswordSubmitEditing = (): void => {
    if (!isConfirmation && !validatePassword(password).valid) {
      setError(PasswordErrors.InvalidPassword)
      return
    }
    if (isConfirmation && passwordToConfirm !== password) {
      setError(PasswordErrors.PasswordsDoNotMatch)
      return
    }
    setError(undefined)
    Keyboard.dismiss()
  }

  const onPressNext = (): void => {
    if (!isConfirmation && !validatePassword(password).valid) {
      setError(PasswordErrors.InvalidPassword)
      return
    }
    if (isConfirmation && passwordToConfirm !== password) {
      setError(PasswordErrors.PasswordsDoNotMatch)
      return
    }

    if (!error) {
      navigateToNextScreen({ password })
    }
  }

  return (
    <>
      <Flex gap="$spacing24" mb="$spacing24" mx="$spacing8">
        <Flex gap="$spacing8">
          <PasswordInput
            ref={passwordInputRef}
            placeholder={isConfirmation ? t('Confirm password') : t('Create password')}
            returnKeyType="next"
            value={password}
            onChangeText={(newText: string): void => {
              setError(undefined)
              onPasswordChangeText(newText)
            }}
            onSubmitEditing={onPasswordSubmitEditing}
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
        {!isConfirmation && (
          <CheckBox
            checked={consentChecked}
            text={t(
              'I understand that if I forget my password, Uniswap Labs cannot retrieve my recovery phrase.'
            )}
            onCheckPressed={onPressConsent}
          />
        )}
      </Flex>
      <Button disabled={isButtonDisabled} testID={ElementName.Next} onPress={onPressNext}>
        {t('Continue')}
      </Button>
    </>
  )
}
