import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, TextInput } from 'react-native'
import { Button } from 'src/components/buttons/Button'
import { CheckBox } from 'src/components/buttons/CheckBox'
import { PasswordInput } from 'src/components/input/PasswordInput'
import { Flex } from 'src/components/layout'
import { PasswordError } from 'src/features/onboarding/PasswordError'
import { ElementName } from 'src/features/telemetry/constants'
import { isValidPassword } from 'src/utils/password'

export enum PasswordErrors {
  InvalidPassword = 'InvalidPassword',
  PasswordsDoNotMatch = 'PasswordsDoNotMatch',
}

type Props = {
  onPressDone: (password: string) => void
  doneButtonText: string
  focusPassword?: boolean
}

export function CloudBackupSetPassword({
  onPressDone: onDoneButtonPressed,
  doneButtonText,
  focusPassword = false,
}: Props): JSX.Element {
  const { t } = useTranslation()
  const passwordInputRef = useRef<TextInput>(null)
  const confirmPasswordRef = useRef<TextInput>(null)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [consentChecked, setConsentChecked] = useState(false)
  const [error, setError] = useState<PasswordErrors | undefined>(undefined)

  const isButtonDisabled =
    !consentChecked || !!error || password.length === 0 || confirmPassword.length === 0

  const onPressConsent = (): void => {
    setConsentChecked(!consentChecked)
  }

  const onPasswordSubmitEditing = (): void => {
    if (!isValidPassword(password)) {
      setError(PasswordErrors.InvalidPassword)
      return
    }

    setError(undefined)
    confirmPasswordRef.current?.focus()
  }

  const onConfirmPasswordChangeText = (newConfirmPassword: string): void => {
    if (isValidPassword(password) && newConfirmPassword === password) {
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
    if (!isValidPassword(password)) {
      setError(PasswordErrors.InvalidPassword)
      return
    }

    if (confirmPassword !== password) {
      setError(PasswordErrors.PasswordsDoNotMatch)
      return
    }

    if (!error) {
      onDoneButtonPressed(password)
    }
  }

  useEffect(() => {
    if (focusPassword) {
      passwordInputRef.current?.focus()
    }
  }, [focusPassword])

  return (
    <>
      <Flex gap="spacing24" mb="spacing24" mx="spacing8">
        <Flex gap="spacing8">
          <PasswordInput
            ref={passwordInputRef}
            placeholder={t('Enter password')}
            returnKeyType="next"
            value={password}
            onChangeText={(newText: string): void => {
              setError(undefined)
              setPassword(newText)
            }}
            onSubmitEditing={onPasswordSubmitEditing}
          />
          <PasswordInput
            ref={confirmPasswordRef}
            placeholder={t('Confirm password')}
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
        <CheckBox
          checked={consentChecked}
          text={t(
            'I understand that if I forget my password, Uniswap Labs cannot retrieve my recovery phrase.'
          )}
          onCheckPressed={onPressConsent}
        />
      </Flex>
      <Button
        disabled={isButtonDisabled}
        label={doneButtonText}
        name={ElementName.Next}
        onPress={onPressNext}
      />
    </>
  )
}
