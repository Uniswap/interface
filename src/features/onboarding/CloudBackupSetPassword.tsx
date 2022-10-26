import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, TextInput } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { CheckBox } from 'src/components/buttons/CheckBox'
import { PasswordInput } from 'src/components/input/PasswordInput'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
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
}

export function CloudBackupSetPassword({
  onPressDone: onDoneButtonPressed,
  doneButtonText,
}: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const confirmPasswordRef = useRef<TextInput>(null)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [consentChecked, setConsentChecked] = useState(false)
  const [error, setError] = useState<PasswordErrors | undefined>(undefined)

  const errorStyle = { opacity: error ? 100 : 0 }

  const onPressConsent = () => {
    setConsentChecked(!consentChecked)
  }

  const onPasswordSubmitEditing = () => {
    if (!isValidPassword(password)) {
      setError(PasswordErrors.InvalidPassword)
      return
    }

    setError(undefined)
    confirmPasswordRef.current?.focus()
  }

  const onConfirmPasswordChangeText = (newConfirmPassword: string) => {
    if (isValidPassword(password) && newConfirmPassword === password) {
      setError(undefined)
    }
    setConfirmPassword(newConfirmPassword)
  }

  const onConfirmPasswordSubmitEditing = () => {
    if (confirmPassword !== password) {
      setError(PasswordErrors.PasswordsDoNotMatch)
      return
    }

    setError(undefined)
    Keyboard.dismiss()
  }

  const onPressNext = () => {
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
  return (
    <>
      <Flex gap="xs" mb="lg">
        <Flex gap="xs">
          <PasswordInput
            placeholder={t('Enter password')}
            returnKeyType="next"
            value={password}
            onChangeText={(newText: string) => {
              setPassword(newText)
            }}
            onSubmitEditing={onPasswordSubmitEditing}
          />
          <PasswordInput
            ref={confirmPasswordRef}
            placeholder={t('Confirm password')}
            value={confirmPassword}
            onChangeText={onConfirmPasswordChangeText}
            onSubmitEditing={onConfirmPasswordSubmitEditing}
          />
          <PasswordError
            errorText={
              error === PasswordErrors.InvalidPassword
                ? t('Password must be at least 8 characters')
                : t('Passwords do not match')
            }
            style={errorStyle}
          />
        </Flex>
        <Flex row gap="xs">
          <CheckBox
            checked={consentChecked}
            size={theme.iconSizes.sm}
            onCheckPressed={onPressConsent}
          />
          <Text color="textPrimary" variant="bodyLarge">
            {t(
              'I understand that if I forget my password, Uniswap Labs cannot retrieve my recovery phrase.'
            )}
          </Text>
        </Flex>
      </Flex>
      <Button
        disabled={!consentChecked}
        label={doneButtonText}
        name={ElementName.Next}
        onPress={onPressNext}
      />
    </>
  )
}
