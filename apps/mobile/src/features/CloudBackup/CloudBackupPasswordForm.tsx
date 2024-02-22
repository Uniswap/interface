import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, TextInput } from 'react-native'
import { PasswordInput } from 'src/components/input/PasswordInput'
import { PasswordError } from 'src/features/onboarding/PasswordError'
import { Button, Flex, Icons, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { ElementName } from 'wallet/src/telemetry/constants'
import { validatePassword } from 'wallet/src/utils/password'

export enum PasswordErrors {
  WeakPassword = 'WeakPassword',
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

  const [error, setError] = useState<PasswordErrors | string | undefined>(undefined)

  const isButtonDisabled = !!error || password.length === 0

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

  const onPasswordSubmitEditing = (): void => {
    const { valid, validationErrorString } = validatePassword(password)
    if (!isConfirmation && !valid) {
      setError(validationErrorString || PasswordErrors.WeakPassword)
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
    const { valid, validationErrorString } = validatePassword(password)
    if (!isConfirmation && !valid) {
      setError(validationErrorString || PasswordErrors.WeakPassword)
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

  let errorText = ''
  if (error === PasswordErrors.WeakPassword) {
    errorText = t('Weak password')
  } else if (error === PasswordErrors.PasswordsDoNotMatch) {
    errorText = t('Passwords do not match')
  } else if (error) {
    // use the upstream zxcvbn error message
    errorText = error
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
          {error ? <PasswordError errorText={errorText} /> : null}
        </Flex>
        {!isConfirmation && (
          <Flex centered row gap="$spacing12" px="$spacing16">
            <Icons.DiamondExclamation color="$neutral2" size={iconSizes.icon20} />
            <Text color="$neutral2" variant="body3">
              {t(
                'Uniswap Labs does not store your password and can’t recover it, so it’s crucial you remember it.'
              )}
            </Text>
          </Flex>
        )}
      </Flex>
      <Button disabled={isButtonDisabled} testID={ElementName.Next} onPress={onPressNext}>
        {t('Continue')}
      </Button>
    </>
  )
}
