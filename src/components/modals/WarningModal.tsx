import React, { PropsWithChildren } from 'react'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangleIcon from 'src/assets/icons/alert-triangle.svg'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { WarningSeverity } from 'src/components/warnings/types'

type WarningModalProps = {
  isVisible: boolean
  onClose?: () => void
  onConfirm?: () => void
  modalName: ModalName
  title: string
  caption?: string
  closeText?: string
  confirmText?: string
  severity?: WarningSeverity
}

export default function WarningModal({
  isVisible,
  onClose,
  onConfirm,
  modalName,
  title,
  caption,
  closeText,
  confirmText,
  severity = WarningSeverity.Medium,
  children,
}: PropsWithChildren<WarningModalProps>) {
  const theme = useAppTheme()
  return (
    <BottomSheetModal
      backgroundColor={theme.colors.backgroundSurface}
      isVisible={isVisible}
      name={modalName}
      onClose={onClose}>
      <Flex centered gap="md" mb="lg" p="lg">
        <Flex
          centered
          borderColor={severity === WarningSeverity.High ? 'accentFailure' : 'accentWarning'}
          borderRadius="md"
          borderWidth={1}
          p="sm">
          <AlertTriangleIcon
            color={
              severity === WarningSeverity.High
                ? theme.colors.accentFailure
                : theme.colors.accentWarning
            }
            height={24}
            width={24}
          />
        </Flex>
        <Text textAlign="center" variant="mediumLabel">
          {title}
        </Text>
        {caption && (
          <Text color="textSecondary" textAlign="center" variant="bodySmall">
            {caption}
          </Text>
        )}
        {children}
        <Flex centered row gap="sm" pt="lg">
          {closeText && (
            <PrimaryButton
              borderRadius="md"
              flex={1}
              label={closeText}
              variant="transparent"
              onPress={onClose}
            />
          )}
          {confirmText && (
            <PrimaryButton
              borderRadius="md"
              flex={1}
              label={confirmText}
              name={ElementName.Confirm}
              testID={ElementName.Confirm}
              variant={severity === WarningSeverity.High ? 'warningDark' : 'blue'}
              onPress={onConfirm}
            />
          )}
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}
