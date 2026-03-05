import { useTranslation } from 'react-i18next'
import { Anchor, Button, Flex, Text, TouchableArea } from 'ui/src'
import { UserLock } from 'ui/src/components/icons/UserLock'
import { X } from 'ui/src/components/icons/X'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

interface KycFailedModalProps {
  isOpen: boolean
  onClose: () => void
  providerName?: string
}

export function KycFailedModal({ isOpen, onClose, providerName = 'Predicate' }: KycFailedModalProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Modal name={ModalName.KycFailed} isModalOpen={isOpen} onClose={onClose} maxWidth={420} padding={0}>
      <Flex position="relative" backgroundColor="$surface1" p="$spacing24" gap="$spacing24">
        <TouchableArea
          position="absolute"
          top="$spacing16"
          right="$spacing16"
          p="$spacing8"
          onPress={onClose}
          borderRadius="$rounded8"
          zIndex={2}
        >
          <X size="$icon.24" color="$neutral2" />
        </TouchableArea>

        <Flex gap="$spacing16" alignItems="center" pt="$spacing16">
          <Flex
            width={48}
            height={48}
            borderRadius="$rounded16"
            backgroundColor="$surface3"
            justifyContent="center"
            alignItems="center"
          >
            <UserLock size="$icon.24" color="$neutral1" />
          </Flex>

          <Flex gap="$spacing8" alignItems="center">
            <Text variant="subheading1" color="$neutral1" textAlign="center">
              {t('toucan.kyc.failed.title')}
            </Text>
            <Text variant="body3" color="$neutral2" textAlign="center">
              {t('toucan.kyc.failed.description', { provider: providerName })}
            </Text>
            <Anchor
              href="mailto:support@predicate.io"
              flex={1}
              alignSelf="center"
              textAlign="center"
              fontSize="$small"
              lineHeight="$spacing12"
              textDecorationLine="none"
            >
              {t('toucan.kyc.failed.contactSupport', { provider: providerName })}
            </Anchor>
          </Flex>
        </Flex>

        <Flex gap="$spacing12" width="100%">
          <Button fill={false} variant="default" emphasis="secondary" size="medium" onPress={onClose} width="100%">
            {t('common.button.cancel')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
