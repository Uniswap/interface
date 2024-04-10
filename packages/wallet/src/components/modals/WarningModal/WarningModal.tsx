import { PropsWithChildren, ReactNode } from 'react'
import { ColorValue } from 'react-native'
import { Button, Flex, Icons, Text, useSporeColors } from 'ui/src'
import { opacify } from 'ui/src/theme'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { WarningColor, WarningSeverity } from 'wallet/src/features/transactions/WarningModal/types'
import { ElementName, ModalNameType } from 'wallet/src/telemetry/constants'

export type WarningModalProps = {
  onClose?: () => void
  onCancel?: () => void
  onConfirm?: () => void
  modalName: ModalNameType
  title: string
  caption?: string
  closeText?: string
  confirmText?: string
  severity?: WarningSeverity
  isDismissible?: boolean
  hideHandlebar?: boolean
  icon?: ReactNode
  // when icon is undefined we default it to triangle, this allows us to hide it
  hideIcon?: boolean
  backgroundIconColor?: ColorValue
}

const WARNING_MODAL_BG_SIZE = 48

export function WarningModal({
  onClose,
  onCancel,
  onConfirm,
  modalName,
  title,
  caption,
  closeText,
  confirmText,
  severity = WarningSeverity.Medium,
  children,
  isDismissible = true,
  hideHandlebar = false,
  icon,
  hideIcon,
  backgroundIconColor,
}: PropsWithChildren<WarningModalProps>): JSX.Element {
  const colors = useSporeColors()
  const alertColor = getAlertColor(severity)
  const alertColorValue = alertColor.text as keyof typeof colors

  return (
    <BottomSheetModal
      backgroundColor={colors.surface1.get()}
      hideHandlebar={hideHandlebar}
      isDismissible={isDismissible}
      name={modalName}
      onClose={onClose}>
      <Flex
        centered
        gap="$spacing12"
        pb="$spacing12"
        pt={hideHandlebar ? '$spacing24' : '$spacing12'}
        px="$spacing24">
        {!hideIcon && (
          <Flex
            centered
            borderRadius="$rounded12"
            height={WARNING_MODAL_BG_SIZE}
            mb="$spacing8"
            minWidth={WARNING_MODAL_BG_SIZE}
            style={{
              backgroundColor: backgroundIconColor ?? opacify(12, colors[alertColorValue].val),
            }}>
            {icon ?? <Icons.AlertTriangle color={alertColor.text} size="$icon.24" />}
          </Flex>
        )}
        <Text textAlign="center" variant="body1">
          {title}
        </Text>
        {caption && (
          <Text color="$neutral2" textAlign="center" variant="body2">
            {caption}
          </Text>
        )}
        {children}
        <Flex centered row gap="$spacing12" pt={children ? '$spacing12' : '$spacing24'}>
          {closeText && (
            <Button fill theme="secondary" onPress={onCancel ?? onClose}>
              {closeText}
            </Button>
          )}
          {confirmText && (
            <Button
              fill
              testID={ElementName.Confirm}
              theme={alertColor.buttonTheme}
              onPress={onConfirm}>
              {confirmText}
            </Button>
          )}
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}

export const getAlertColor = (severity?: WarningSeverity): WarningColor => {
  switch (severity) {
    case WarningSeverity.None:
      return {
        text: '$neutral2',
        background: '$neutral2',
        buttonTheme: 'secondary',
      }
    case WarningSeverity.Low:
      return {
        text: '$neutral2',
        background: '$surface2',
        buttonTheme: 'tertiary',
      }
    case WarningSeverity.High:
      return {
        text: '$statusCritical',
        background: '$DEP_accentCriticalSoft',
        buttonTheme: 'detrimental',
      }
    case WarningSeverity.Medium:
      return {
        text: '$DEP_accentWarning',
        background: '$DEP_accentWarningSoft',
        buttonTheme: 'warning',
      }
    default:
      return {
        text: '$neutral2',
        background: '$transparent',
        buttonTheme: 'tertiary',
      }
  }
}
