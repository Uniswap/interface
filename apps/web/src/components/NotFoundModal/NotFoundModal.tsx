import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { GetHelpHeader } from 'uniswap/src/components/dialog/GetHelpHeader'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

function NotFoundModal({
  title,
  description,
  isOpen,
  closeModal,
}: {
  title: string
  description: string
  isOpen: boolean
  closeModal: () => void
}) {
  const { t } = useTranslation()

  return (
    <Modal name={ModalName.NotFound} isModalOpen={isOpen} onClose={closeModal} padding={0}>
      <Flex centered gap="$gap12" px="$spacing24" py="$spacing24">
        <GetHelpHeader closeModal={closeModal} />
        <Flex
          centered
          backgroundColor="$surface2"
          borderRadius="$rounded12"
          p="$spacing12"
          mt="$spacing16"
          mb="$spacing8"
        >
          <AlertTriangleFilled color="$neutral3" size="$icon.24" />
        </Flex>

        <Text textAlign="center" variant="heading3">
          {title}
        </Text>

        <Text color="$neutral2" textAlign="center" variant="body2">
          {description}
        </Text>

        <Button mt="$spacing16" size="large" onPress={closeModal}>
          {t('common.button.goBack')}
        </Button>
      </Flex>
    </Modal>
  )
}

export default NotFoundModal
