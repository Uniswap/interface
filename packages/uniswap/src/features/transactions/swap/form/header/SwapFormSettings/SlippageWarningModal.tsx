import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { X } from 'ui/src/components/icons/X'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isMobileApp, isMobileWeb } from 'utilities/src/platform'

interface SlippageWarningModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SlippageWarningModal({ isOpen, onClose }: SlippageWarningModalProps): JSX.Element {
  const { t } = useTranslation()
  return (
    <Modal
      isDismissible
      name={ModalName.SlippageWarningModal}
      gap="$gap16"
      padding={isMobileApp ? '$spacing24' : '$spacing16'}
      height="max-content"
      isModalOpen={isOpen}
      maxWidth={420}
      onClose={onClose}
    >
      {!isMobileApp && !isMobileWeb && (
        <TouchableArea alignSelf="flex-end" onPress={onClose}>
          <X color="$neutral2" size="$icon.24" />
        </TouchableArea>
      )}
      <Flex flexDirection="column" alignItems="center" gap="$gap24">
        <Flex gap="$gap16" backgroundColor="$statusCritical2" borderRadius="$rounded12" p="$spacing12">
          <AlertTriangleFilled color="$statusCritical" size="$icon.24" />
        </Flex>
        <Flex centered rowGap="$spacing8">
          <Text variant="subheading1">{t('swap.settings.slippage.warning')}</Text>
          <Text variant="body2" color="$neutral2" px="$spacing8" textAlign="center">
            {t('swap.settings.slippage.warning.description')}
          </Text>
        </Flex>
        <Flex centered row width="100%" px={isMobileApp ? '$spacing24' : '$spacing6'}>
          <Button emphasis="secondary" onPress={onClose}>
            {t('common.close')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
