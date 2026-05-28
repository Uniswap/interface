import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { PADDING_STRENGTH_INDICATOR, PasswordInput } from 'src/app/components/PasswordInput'
import { Button, Flex, Text } from 'ui/src'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { usePasswordForm } from 'wallet/src/utils/password'

export function ChangePasswordForm({ onNext }: { onNext: () => void }): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

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
      await Keyring.changePassword(password)
      onNext()
      dispatch(pushNotification({ type: AppNotificationType.PasswordChanged }))
      sendAnalyticsEvent(ExtensionEventName.PasswordChanged)
    }
  }, [checkSubmit, password, onNext, dispatch])

  return (
    <Flex grow pt="$spacing24">
      <Flex grow alignItems="center" gap="$spacing16" px="$spacing12">
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
        <Text color="$statusCritical" opacity={errorText ? 1 : 0} textAlign="center" variant="body2">
          {errorText || 'Placeholder text'}
        </Text>
      </Flex>
      <Flex row>
        <Button isDisabled={!enableNext} emphasis="secondary" onPress={onSubmit}>
          {t('common.button.save')}
        </Button>
      </Flex>
    </Flex>
  )
}
