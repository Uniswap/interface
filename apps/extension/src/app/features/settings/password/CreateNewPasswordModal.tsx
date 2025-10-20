import { useTranslation } from 'react-i18next'
import { ChangePasswordForm } from 'src/app/features/settings/password/ChangePasswordForm'
import { Flex, Square, Text, useSporeColors } from 'ui/src'
import { Lock } from 'ui/src/components/icons'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function CreateNewPasswordModal({
  isOpen,
  onNext,
  onClose,
}: {
  isOpen: boolean
  onNext: (password: string) => void
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  return (
    <Modal
      alignment="center"
      backgroundColor={colors.surface1.val}
      hideHandlebar={true}
      isDismissible={true}
      isModalOpen={isOpen}
      name={ModalName.CreateNewPassword}
      onClose={onClose}
    >
      <Flex centered gap="$spacing16" pt="$spacing20">
        <Square backgroundColor="$surface2" borderRadius="$rounded12" size="$spacing48">
          <Lock color="$neutral1" size="$icon.24" />
        </Square>

        <Text py="$spacing4" textAlign="center" variant="subheading2">
          {t('settings.setting.password.change.title')}
        </Text>

        <ChangePasswordForm onNext={onNext} />
      </Flex>
    </Modal>
  )
}
