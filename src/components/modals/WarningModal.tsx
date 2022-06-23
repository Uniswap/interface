import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangleIcon from 'src/assets/icons/alert-triangle.svg'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { ElementName, ModalName } from 'src/features/telemetry/constants'

export default function WarningModal({
  isVisible,
  onClose,
  onConfirm,
  modalName,
  title,
  caption,
  closeText,
  confirmText,
}: {
  isVisible: boolean
  onClose: () => void
  onConfirm: () => void
  modalName: ModalName
  title: string
  caption: string
  closeText?: string
  confirmText?: string
}) {
  const theme = useAppTheme()
  return (
    <BottomSheetModal
      backgroundColor={theme.colors.backgroundSurface}
      isVisible={isVisible}
      name={modalName}
      onClose={onClose}>
      <Flex centered gap="md" mb="lg" padding="xl">
        <AlertTriangleIcon color={theme.colors.accentWarning} height={24} width={24} />
        <Text textAlign="center" variant="mediumLabel">
          {title}
        </Text>
        <Text color="textSecondary" textAlign="center" variant="smallLabel">
          {caption}
        </Text>
        <Flex centered row gap="sm" paddingTop="lg">
          {closeText && (
            <PrimaryButton label={closeText} variant="gray" width="50%" onPress={onClose} />
          )}
          {confirmText && (
            <PrimaryButton
              label={confirmText}
              name={ElementName.Confirm}
              testID={ElementName.Confirm}
              variant="blue"
              width="50%"
              onPress={onConfirm}
            />
          )}
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}
