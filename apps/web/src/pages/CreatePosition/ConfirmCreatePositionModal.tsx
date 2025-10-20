import { PriceDifference } from 'components/Liquidity/Create/types'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { GetHelpHeader } from 'uniswap/src/components/dialog/GetHelpHeader'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export default function ConfirmCreatePositionModal({
  isOpen,
  onClose,
  onContinue,
  priceDifference,
}: {
  isOpen: boolean
  onClose: () => void
  onContinue: () => void
  priceDifference: PriceDifference
}) {
  const { t } = useTranslation()

  return (
    <Modal
      name={ModalName.ConfirmCreatePosition}
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
        <Flex gap="$gap16" backgroundColor="$statusCritical2" borderRadius="$rounded12" p="$spacing12">
          <AlertTriangleFilled size={20} color="$statusCritical" />
        </Flex>
        <Flex centered rowGap="$spacing8">
          <Text variant="subheading1">{t('position.deposit.confirm.create.title')}</Text>
          <Text variant="body2" color="$neutral2" px="$spacing8" textAlign="center">
            {priceDifference.value < 0
              ? t('position.deposit.confirm.create.description.less', {
                  value: priceDifference.absoluteValue,
                })
              : t('position.deposit.confirm.create.description.more', {
                  value: priceDifference.absoluteValue,
                })}
          </Text>
          <Button emphasis="text-only">{t('common.button.learn')}</Button>
        </Flex>
        <Flex row gap="$spacing8" width="100%" mt="$spacing8">
          <Button emphasis="secondary" onPress={onClose}>
            {t('common.button.cancel')}
          </Button>
          <Button onPress={onContinue} variant="critical">
            {t('common.button.proceed')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
