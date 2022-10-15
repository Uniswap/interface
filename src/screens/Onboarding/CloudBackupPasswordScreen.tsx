import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { TextInput } from 'react-native-gesture-handler'
import { useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import { CheckBox } from 'src/components/buttons/CheckBox'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { PasswordInput } from 'src/components/input/PasswordInput'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'
import { isValidPassword } from 'src/utils/password'

enum PasswordError {
  InvalidPassword = 'InvalidPassword',
  PasswordsDoNotMatch = 'PasswordsDoNotMatch',
}

export type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  OnboardingScreens.BackupCloudPasswordScreen
>

export function CloudBackupPasswordScreen() {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const confirmPasswordRef = useRef<TextInput>(null)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [consentChecked, setConsentChecked] = useState(false)
  const [error, setError] = useState<PasswordError | undefined>(undefined)

  const errorStyle = { opacity: error ? 100 : 0 }

  const onPressConsent = () => {
    setConsentChecked(!consentChecked)
  }

  const onPasswordSubmitEditing = () => {
    if (!isValidPassword(password)) {
      setError(PasswordError.InvalidPassword)
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
      setError(PasswordError.PasswordsDoNotMatch)
      return
    }

    setError(undefined)
    Keyboard.dismiss()
  }

  const onPressNext = () => {
    if (!isValidPassword(password)) {
      setError(PasswordError.InvalidPassword)
      return
    }

    if (confirmPassword !== password) {
      setError(PasswordError.PasswordsDoNotMatch)
      return
    }

    if (!error) {
      // TODO [in a different PR]: navigate to processing screen
    }
  }

  return (
    <OnboardingScreen
      subtitle={t(
        'Setting a password will encrypt your recovery phrase backup, making it harder for an attacker to steal your assets.'
      )}
      title={t('Create your backup password')}>
      <Flex grow m="sm">
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
        <AnimatedFlex row alignItems="center" justifyContent="center" py="sm" style={errorStyle}>
          <AlertTriangle
            color={theme.colors.accentFailure}
            height={ERROR_ICON_HEIGHT}
            width={ERROR_ICON_HEIGHT}
          />
          <Text color="accentFailure" textAlign="center" variant="body">
            {error === PasswordError.InvalidPassword
              ? t('Password must be at least 8 characters')
              : t('Passwords do not match')}
          </Text>
        </AnimatedFlex>
        <Flex row px="xs">
          <CheckBox
            checked={consentChecked}
            size={theme.iconSizes.sm}
            onCheckPressed={onPressConsent}
          />
          <Text color="textPrimary" variant="bodySmall">
            {t(
              'I understand that if I forget my password, Uniswap Labs can’t retrieve my recovery phrase.'
            )}
          </Text>
        </Flex>
      </Flex>
      <Flex justifyContent="flex-end">
        <PrimaryButton
          disabled={!consentChecked}
          label={t('Continue')}
          name={ElementName.Next}
          testID={ElementName.Next}
          textVariant="mediumLabel"
          variant="onboard"
          onPress={onPressNext}
        />
      </Flex>
    </OnboardingScreen>
  )
}

const ERROR_ICON_HEIGHT = 20
