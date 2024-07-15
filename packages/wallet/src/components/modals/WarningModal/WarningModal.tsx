import { PropsWithChildren, ReactNode } from 'react'
import { ColorValue } from 'react-native'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import { AlertTriangle } from 'ui/src/components/icons'
import { opacify } from 'ui/src/theme'
import { BottomSheetModal } from 'uniswap/src/components/modals/BottomSheetModal'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isWeb } from 'utilities/src/platform'
import { WarningColor, WarningSeverity } from 'wallet/src/features/transactions/WarningModal/types'

export type WarningModalProps = {
  onClose?: () => void
  onCancel?: () => void
  onConfirm?: () => void
  modalName: ModalNameType
  title: ReactNode
  caption?: string
  closeText?: string
  confirmText?: string
  severity?: WarningSeverity
  isDismissible?: boolean
  hideHandlebar?: boolean
  icon?: ReactNode
  // when icon is undefined we default it to triangle, this allows us to hide it
  hideIcon?: boolean
  // `undefined` means we use the default color, `false` means no background color
  backgroundIconColor?: ColorValue | false
  maxWidth?: number
}

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
  maxWidth,
}: PropsWithChildren<WarningModalProps>): JSX.Element {
  const colors = useSporeColors()
  const alertColor = getAlertColor(severity)
  const alertColorValue = alertColor.text as keyof typeof colors

  return (
    <BottomSheetModal
      backgroundColor={colors.surface1.get()}
      hideHandlebar={hideHandlebar}
      isDismissible={isDismissible}
      maxWidth={maxWidth}
      name={modalName}
      onClose={onClose}
    >
      <Flex
        centered
        gap="$spacing12"
        maxWidth={maxWidth}
        pb={isWeb ? '$none' : '$spacing12'}
        pt={hideHandlebar ? '$spacing24' : '$spacing12'}
        px={isWeb ? '$none' : '$spacing24'}
      >
        {!hideIcon && (
          <Flex
            centered
            borderRadius="$rounded12"
            mb="$spacing8"
            p={backgroundIconColor === false ? '$none' : '$spacing12'}
            style={
              backgroundIconColor === false
                ? undefined
                : {
                    backgroundColor: backgroundIconColor ?? opacify(12, colors[alertColorValue].val),
                  }
            }
          >
            {icon ?? <AlertTriangle color={alertColor.text} size="$icon.24" />}
          </Flex>
        )}
        <Text textAlign="center" variant={isWeb ? 'subheading2' : 'body1'}>
          {title}
        </Text>
        {caption && (
          <Text color="$neutral2" textAlign="center" variant={isWeb ? 'body3' : 'body2'}>
            {caption}
          </Text>
        )}
        {children}
        <Flex centered row gap="$spacing12" pt={children ? '$spacing12' : '$spacing24'} width="100%">
          {closeText && (
            <Button flex={1} flexBasis={1} theme="secondary" onPress={onCancel ?? onClose}>
              {closeText}
            </Button>
          )}
          {confirmText && (
            <Button flex={1} flexBasis={1} testID={TestID.Confirm} theme={alertColor.buttonTheme} onPress={onConfirm}>
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
