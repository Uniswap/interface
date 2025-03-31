import { useTranslation } from 'react-i18next'
import { useCloseModal, useModalIsOpen } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { Button, Flex, ModalCloseIcon, Spacer, Text } from 'ui/src'
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
        <Flex px="$padding8">
          <Flex gap="$gap16">
            <Text variant="heading2">{t('search.ukDisclaimer')}</Text>
            <Text variant="body2">{t('notice.uk')}</Text>
          </Flex>
          <Spacer size="$spacing24" />
          <Flex row>
            <Button size="small" onPress={closeModal}>
              {t('common.dismiss')}
            </Button>
          </Flex>
          <Spacer size="$spacing12" />
        </Flex>
      </Flex>
    </Modal>
  )
}
