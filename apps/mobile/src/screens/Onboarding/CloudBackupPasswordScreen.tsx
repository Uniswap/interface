import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput } from 'react-native'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { CheckBox } from 'src/components/buttons/CheckBox'
import { PasswordInput } from 'src/components/input/PasswordInput'
import { Flex } from 'src/components/layout'
import { PasswordErrors } from 'src/features/onboarding/CloudBackupSetPassword'
import { PasswordError } from 'src/features/onboarding/PasswordError'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'
import { validatePassword } from 'wallet/src/utils/password'

export type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  OnboardingScreens.BackupCloudPassword
>

export function CloudBackupPasswordScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()

  const passwordInputRef = useRef<TextInput>(null)
  const [password, setPassword] = useState('')

  const [consentChecked, setConsentChecked] = useState(false)
  const [error, setError] = useState<PasswordErrors | undefined>(undefined)

  const isButtonDisabled = !consentChecked || !!error || password.length === 0

  const onPressConsent = (): void => {
    setConsentChecked(!consentChecked)
  }

  const onPasswordSubmitEditing = (): void => {
    if (!validatePassword(password).valid) {
      setError(PasswordErrors.InvalidPassword)
      return
    }
    setError(undefined)
  }

  const onPressNext = (): void => {
    if (!validatePassword(password).valid) {
      setError(PasswordErrors.InvalidPassword)
      return
    }
    if (!error) {
      navigation.navigate({
        name: OnboardingScreens.BackupCloudPasswordConfirm,
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
      title={t('Create your backup password')}>
      <Flex gap="spacing24" mb="spacing24" mx="spacing8">
        <Flex gap="spacing8">
          <PasswordInput
            ref={passwordInputRef}
            placeholder={t('Create password')}
            returnKeyType="next"
            value={password}
            onChangeText={(newText: string): void => {
              setError(undefined)
              setPassword(newText)
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
        label={t('Continue')}
        name={ElementName.Next}
        onPress={onPressNext}
      />
    </SafeKeyboardOnboardingScreen>
  )
}
