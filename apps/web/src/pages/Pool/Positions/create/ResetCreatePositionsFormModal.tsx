import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import { HelpCircle } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { DeprecatedButton, Flex, Text, useSporeColors } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

interface ResetCreatePositionFormModalProps {
  isOpen: boolean
  onClose: () => void
  onHandleReset: () => void
}

export default function ResetCreatePositionFormModal({
  isOpen,
  onClose,
  onHandleReset,
}: ResetCreatePositionFormModalProps) {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const handleReset = () => {
    onHandleReset()
    onClose()
  }

  return (
    <Modal
      name={ModalName.ResetCreatePositionsForm}
      onClose={onClose}
      isDismissible
      gap="$gap24"
      padding="$padding16"
      isModalOpen={isOpen}
      maxWidth={420}
    >
      <Flex row justifyContent="flex-end" alignItems="center" gap="$spacing8" width="100%">
        <GetHelpHeader closeModal={onClose} />
      </Flex>
      <Flex flexDirection="column" alignItems="center" gap="$spacing16">
        <Flex gap="$gap16" backgroundColor="$surface3" borderRadius="$rounded12" p="$spacing12">
          <HelpCircle stroke={colors.neutral1.val} size={20} />
        </Flex>
        <Flex centered rowGap="$spacing2">
          <Text variant="subheading1">{t('common.areYouSure')}</Text>
          <Text variant="body2" color="$neutral2" px="$spacing8" textAlign="center">
            {t('position.resetDescription')}
          </Text>
        </Flex>
        <Flex row gap="$spacing8" width="100%" mt="$spacing8">
          <DeprecatedButton theme="secondary" borderRadius="12px" py="$spacing8" flex={1} onPress={onClose}>
            <Text variant="buttonLabel3" color="$neutralContrast">
              {t('common.button.cancel')}
            </Text>
          </DeprecatedButton>
          <DeprecatedButton
            theme="tertiary"
            py="$spacing8"
            backgroundColor="$accent3"
            borderRadius="12px"
            hoverStyle={{
              backgroundColor: undefined,
              opacity: 0.8,
            }}
            pressStyle={{
              backgroundColor: undefined,
            }}
            flex={1}
            onPress={handleReset}
          >
            <Text variant="buttonLabel3" color="$surface1">
              {t('common.button.reset')}
            </Text>
          </DeprecatedButton>
        </Flex>
      </Flex>
    </Modal>
  )
}
