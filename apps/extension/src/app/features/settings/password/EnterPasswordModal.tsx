import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PasswordInputWithBiometrics } from 'src/app/components/PasswordInput'
import { reauthenticateWithBiometricCredential } from 'src/app/features/biometricUnlock/useUnlockWithBiometricCredentialMutation'
import { Button, Flex, inputStyles, Square, Text, useSporeColors } from 'ui/src'
import { Lock } from 'ui/src/components/icons'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

export function EnterPasswordModal({
  isOpen,
  onNext,
  onClose,
  shouldReturnPassword = false,
  hideBiometrics = false,
}: {
  isOpen: boolean
  onNext: (password?: string) => void
  onClose: () => void
  shouldReturnPassword?: boolean
  hideBiometrics?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const [password, setPassword] = useState('')
  const [showPasswordError, setShowPasswordError] = useState(false)
  const [hideInput, setHideInput] = useState(true)

  const onChangeText = (text: string): void => {
    setPassword(text)
    setShowPasswordError(false)
  }

  const checkPassword = async (): Promise<void> => {
    const success = await Keyring.checkPassword(password)
    if (!success) {
      setShowPasswordError(true)
      return
    }
    onNext(shouldReturnPassword ? password : undefined)
  }

  const { mutate: onPressReauthenticateWithBiometricCredential } = useMutation({
    mutationFn: reauthenticateWithBiometricCredential,
    onSuccess: ({ password: credentialPassword }) => {
      if (credentialPassword) {
        onNext(shouldReturnPassword ? credentialPassword : undefined)
      }
    },
  })

  return (
    <Modal
      alignment="center"
      backgroundColor={colors.surface1.val}
      hideHandlebar={true}
      isDismissible={true}
      isModalOpen={isOpen}
      name={ModalName.EnterPassword}
      onClose={onClose}
    >
      <Flex centered gap="$spacing12" pt="$spacing20">
        <Square backgroundColor="$surface2" borderRadius="$rounded12" size="$spacing48">
          <Lock color="$neutral1" size="$icon.24" />
        </Square>

        <Text py="$spacing4" textAlign="center" variant="subheading2">
          {t('extension.passwordPrompt.title')}
        </Text>

        <PasswordInputWithBiometrics
          autoFocus
          backgroundColor={showPasswordError ? '$statusCritical2' : '$surface1'}
          focusStyle={inputStyles.inputFocus}
          hideInput={hideInput}
          placeholder={t('common.input.password.placeholder')}
          value={password}
          onChangeText={onChangeText}
          onSubmitEditing={checkPassword}
          onToggleHideInput={setHideInput}
          {...(showPasswordError && { borderColor: '$statusCritical' })}
          onPressBiometricUnlock={onPressReauthenticateWithBiometricCredential}
          hideBiometrics={hideBiometrics}
        />

        <Text color="$statusCritical" minHeight="$spacing20" textAlign="center" variant="body3">
          {showPasswordError ? t('extension.passwordPrompt.error.wrongPassword') : ''}
        </Text>

        <Flex row width="100%">
          <Button size="medium" isDisabled={!password.length} emphasis="primary" onPress={checkPassword}>
            {t('common.button.continue')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
