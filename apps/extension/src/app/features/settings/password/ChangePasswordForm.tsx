import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PADDING_STRENGTH_INDICATOR, PasswordInput } from 'src/app/components/PasswordInput'
import { Button, Flex, Text } from 'ui/src'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { usePasswordForm } from 'wallet/src/utils/password'

export function ChangePasswordForm({ onNext }: { onNext: (password: string) => void }): JSX.Element {
  const { t } = useTranslation()

  const {
    enableNext,
    hideInput,
    debouncedPasswordStrength,
    password,
    onPasswordBlur,
    onChangePassword,
    confirmPassword,
    onChangeConfirmPassword,
    setHideInput,
    errorText,
    checkSubmit,
  } = usePasswordForm()

  const onSubmit = useCallback(async () => {
    if (checkSubmit()) {
      // Just change the password and pass it to the parent
      await Keyring.changePassword(password)
      sendAnalyticsEvent(ExtensionEventName.PasswordChanged)
      onNext(password)
    }
  }, [checkSubmit, password, onNext])

  return (
    <Flex grow width="100%">
      <Flex grow alignItems="center" gap="$spacing16" pb="$spacing12">
        <PasswordInput
          autoFocus
          large
          backgroundColor="$surface2"
          hideInput={hideInput}
          passwordStrength={debouncedPasswordStrength}
          placeholder={t('common.input.password.new')}
          pr={PADDING_STRENGTH_INDICATOR}
          value={password}
          onBlur={onPasswordBlur}
          onChangeText={onChangePassword}
        />
        <PasswordInput
          large
          backgroundColor="$surface2"
          hideInput={hideInput}
          placeholder={t('common.input.password.confirm')}
          pr="$spacing48"
          value={confirmPassword}
          onChangeText={onChangeConfirmPassword}
          onSubmitEditing={onSubmit}
          onToggleHideInput={setHideInput}
        />
        <Text
          color="$statusCritical"
          opacity={errorText ? 1 : 0}
          textAlign="center"
          variant="body3"
          minHeight="$spacing20"
        >
          {errorText}
        </Text>
      </Flex>
      <Flex row width="100%">
        <Button size="medium" isDisabled={!enableNext} emphasis="primary" onPress={onSubmit}>
          {t('common.button.continue')}
        </Button>
      </Flex>
    </Flex>
  )
}
