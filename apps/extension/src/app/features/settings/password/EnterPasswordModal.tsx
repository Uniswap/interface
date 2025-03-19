import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PasswordInput } from 'src/app/components/PasswordInput'
import { Button, Flex, Square, Text, inputStyles, useSporeColors } from 'ui/src'
import { Lock } from 'ui/src/components/icons'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

export function EnterPasswordModal({
  isOpen,
  onNext,
  onClose,
}: {
  isOpen: boolean
  onNext: () => void
  onClose: () => void
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
    onNext()
  }

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
          {t('settings.setting.recoveryPhrase.password.title')}
        </Text>
        <PasswordInput
          autoFocus
          backgroundColor={showPasswordError ? '$DEP_accentCriticalSoft' : '$surface1'}
          focusStyle={inputStyles.inputFocus}
          hideInput={hideInput}
          placeholder={t('common.input.password.placeholder')}
          value={password}
          onChangeText={onChangeText}
          onSubmitEditing={checkPassword}
          onToggleHideInput={setHideInput}
          {...(showPasswordError && { borderColor: '$statusCritical' })}
        />
        <Text color="$statusCritical" minHeight="$spacing24" textAlign="center" variant="body2">
          {showPasswordError ? t('setting.recoveryPhrase.remove.password.error') : ''}
        </Text>
        <Flex row width="100%">
          <Button isDisabled={!password.length} emphasis="secondary" onPress={checkPassword}>
            {t('common.button.continue')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
