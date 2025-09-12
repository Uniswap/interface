import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput } from 'react-native'
import { PasswordInput } from 'src/components/input/PasswordInput'
import { useCloudBackupPasswordFormContext } from 'src/features/CloudBackup/CloudBackupForm/CloudBackupPasswordFormContext'
import { PasswordError } from 'src/features/onboarding/PasswordError'
import { Flex, Text } from 'ui/src'
import { useDebounce } from 'utilities/src/time/timing'
import {
  getPasswordStrengthTextAndColor,
  PASSWORD_VALIDATION_DEBOUNCE_MS,
  PasswordErrors,
  PasswordStrength,
} from 'wallet/src/utils/password'

export function CloudPasswordInput(): JSX.Element {
  const { password, error, passwordStrength, isConfirmation, onPasswordChangeText, onPasswordSubmitEditing } =
    useCloudBackupPasswordFormContext()
  const debouncedPasswordStrength = useDebounce(passwordStrength, PASSWORD_VALIDATION_DEBOUNCE_MS)

  const { t } = useTranslation()
  const passwordInputRef = useRef<TextInput>(null)

  let errorText = ''
  if (error === PasswordErrors.PasswordsDoNotMatch) {
    errorText = t('settings.setting.backup.password.error.mismatch')
  } else if (error) {
    // use the upstream zxcvbn error message
    errorText = error
  }

  return (
    <Flex gap="$spacing24" mb="$spacing24">
      <Flex gap="$spacing8">
        <PasswordInput
          ref={passwordInputRef}
          placeholder={
            isConfirmation
              ? t('settings.setting.backup.password.placeholder.confirm')
              : t('settings.setting.backup.password.placeholder.create')
          }
          returnKeyType="next"
          value={password}
          onChangeText={(newText: string): void => {
            onPasswordChangeText(newText)
          }}
          onSubmitEditing={onPasswordSubmitEditing}
        />
        {!isConfirmation && <PasswordStrengthText strength={debouncedPasswordStrength} />}
        {error ? <PasswordError errorText={errorText} /> : null}
      </Flex>
    </Flex>
  )
}

function PasswordStrengthText({ strength }: { strength: PasswordStrength }): JSX.Element {
  const { t } = useTranslation()
  const { color } = getPasswordStrengthTextAndColor(t, strength)

  const hasPassword = strength !== PasswordStrength.NONE
  let strengthText: string = ''
  switch (strength) {
    case PasswordStrength.STRONG:
      strengthText = t('settings.setting.backup.password.strong')
      break
    case PasswordStrength.MEDIUM:
      strengthText = t('settings.setting.backup.password.medium')
      break
    case PasswordStrength.WEAK:
      strengthText = t('settings.setting.backup.password.weak')
      break
    default:
      break
  }

  return (
    <Flex centered row opacity={hasPassword ? 1 : 0} pt="$spacing12" px="$spacing8">
      <Text color={color} variant="body3">
        {strengthText}
      </Text>
    </Flex>
  )
}
