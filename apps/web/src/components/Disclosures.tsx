import { SharedEventName } from '@uniswap/analytics-events'
import { isMobileWeb } from '@universe/environment'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, ModalCloseIcon, Text } from 'ui/src'
import { DisclosuresBody } from 'uniswap/src/components/disclosures/DisclosuresBody'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useModalState } from '~/hooks/useModalState'

export function DisclosuresModal(): JSX.Element {
  const { isOpen, closeModal } = useModalState(ModalName.Disclosures)
  const { t } = useTranslation()

  useEffect(() => {
    if (!isOpen) {
      return
    }

    sendAnalyticsEvent(SharedEventName.PAGE_VIEWED, {
      modal: ModalName.Disclosures,
    })
  }, [isOpen])

  return (
    <Modal name={ModalName.Disclosures} isModalOpen={isOpen} onClose={closeModal} padding={0}>
      <Flex gap="$gap12">
        <Flex row width="100%" justifyContent="space-between" alignItems="center" p="$spacing16" pb="$spacing8">
          <Text variant="subheading1">{t('common.disclosures')}</Text>
          <ModalCloseIcon onClose={closeModal} />
        </Flex>
        <Flex
          maxHeight="70vh"
          $platform-web={{ overflow: 'auto' }}
          px="$spacing16"
          pb="$spacing16"
          onTouchMove={(e) => {
            // prevent modal gesture handler from dismissing modal when content is scrolling
            if (isMobileWeb) {
              e.stopPropagation()
            }
          }}
        >
          <DisclosuresBody variant="body3" />
        </Flex>
      </Flex>
    </Modal>
  )
}
