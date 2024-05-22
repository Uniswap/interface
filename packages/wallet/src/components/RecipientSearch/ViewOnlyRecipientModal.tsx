import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { Eye } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { ModalName } from 'wallet/src/telemetry/constants'

type ViewOnlyRecipientModalProps = {
  onConfirm: () => void
  onCancel: () => void
}

export function ViewOnlyRecipientModal({
  onConfirm,
  onCancel,
}: ViewOnlyRecipientModalProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <BottomSheetModal name={ModalName.ViewOnlyRecipientWarning} onClose={onCancel}>
      <Flex centered gap="$spacing12" pb="$spacing12" pt="$spacing12" px="$spacing24">
        <Flex
          centered
          backgroundColor="$surface2"
          borderRadius="$rounded12"
          height={iconSizes.icon48}
          mb="$spacing8"
          width={iconSizes.icon48}>
          <Eye color="$neutral2" size={iconSizes.icon24} />
        </Flex>

        <Text textAlign="center" variant="body1">
          {t('send.recipient.warning.viewOnly.title')}
        </Text>
        <Text color="$neutral2" textAlign="center" variant="body2">
          {t('send.recipient.warning.viewOnly.message')}
        </Text>

        <Flex centered row gap="$spacing12" pt="$spacing24">
          <Button fill theme="secondary" onPress={onCancel}>
            {t('common.button.goBack')}
          </Button>
          <Button fill theme="detrimental" onPress={onConfirm}>
            {t('common.button.understand')}
          </Button>
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}
