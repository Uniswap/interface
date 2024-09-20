import { PropsWithChildren, ReactNode } from 'react'
// eslint-disable-next-line no-restricted-imports -- type import is safe
import type { ColorValue } from 'react-native'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { opacify } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { getAlertColor } from 'uniswap/src/components/modals/WarningModal/getAlertColor'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isWeb } from 'utilities/src/platform'

export type WarningModalProps = {
  isOpen: boolean
  onClose?: () => void
  onCancel?: () => void
  onConfirm?: () => void
  modalName: ModalNameType
  title?: string
  titleComponent?: ReactNode
  caption?: string
  captionComponent?: ReactNode
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
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  modalName,
  title,
  titleComponent,
  caption,
  captionComponent,
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
    <Modal
      backgroundColor={colors.surface1.val}
      hideHandlebar={hideHandlebar}
      isDismissible={isDismissible}
      isModalOpen={isOpen}
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
            {icon ?? <AlertTriangleFilled color={alertColor.text} size="$icon.24" />}
          </Flex>
        )}
        {title && (
          <Text textAlign="center" variant={isWeb ? 'subheading2' : 'body1'}>
            {title}
          </Text>
        )}
        {titleComponent}
        {caption && (
          <Text color="$neutral2" textAlign="center" variant="body3">
            {caption}
          </Text>
        )}
        {captionComponent}
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
    </Modal>
  )
}
