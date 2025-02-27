import { useTranslation } from 'react-i18next'
import { useCloseModal, useModalIsOpen } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { Button, Flex, ModalCloseIcon, Text } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function UkDisclaimerModal() {
  const { t } = useTranslation()
  const isOpen = useModalIsOpen(ApplicationModal.UK_DISCLAIMER)
  const closeModal = useCloseModal()

  return (
    <Modal name={ModalName.UkDisclaimer} isModalOpen={isOpen} onClose={closeModal} padding={0}>
      <Flex p="$padding8" gap="$gap12">
        <Flex alignItems="flex-end" pt="$spacing8" pb="$spacing4">
          <ModalCloseIcon onClose={closeModal} />
        </Flex>
        <Flex gap="$gap8">
          <Text px="$padding8" variant="heading2">
            {t('search.ukDisclaimer')}
          </Text>
          <Text variant="body2" p="$padding8" pb="$padding12">
            {t('notice.uk')}
          </Text>
        </Flex>
        <Flex px="$padding12" pt="$padding8" pb="$spacing4" gap="$gap12">
          <Button size="small" onPress={() => closeModal()}>
            {t('common.dismiss')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
