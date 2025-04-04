import { PropsWithChildren, ReactNode, useContext } from 'react'
import type { ColorValue } from 'react-native'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { opacify } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { getAlertColor } from 'uniswap/src/components/modals/WarningModal/getAlertColor'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { SwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isWeb } from 'utilities/src/platform'

type WarningModalContentProps = {
  onClose?: () => void
  onReject?: () => void
  onAcknowledge?: () => void
  hideHandlebar?: boolean
  modalName: ModalNameType
  title?: string
  titleComponent?: ReactNode
  caption?: string
  captionComponent?: ReactNode
  rejectText?: string
  acknowledgeText?: string
  severity?: WarningSeverity
  icon?: ReactNode
  // when icon is undefined we default it to triangle, this allows us to hide it
  hideIcon?: boolean
  // `undefined` means we use the default color, `false` means no background color
  backgroundIconColor?: ColorValue | false
  maxWidth?: number
  analyticsProperties?: Record<string, unknown>
}

export type WarningModalProps = {
  isOpen: boolean
  isDismissible?: boolean
} & WarningModalContentProps

export function WarningModalContent({
  onClose,
  onReject,
  onAcknowledge,
  modalName,
  title,
  titleComponent,
  caption,
  captionComponent,
  rejectText: rejectText,
  acknowledgeText,
  severity = WarningSeverity.Medium,
  children,
  icon,
  hideIcon,
  maxWidth,
  hideHandlebar = false,
  backgroundIconColor,
  analyticsProperties,
}: PropsWithChildren<WarningModalContentProps>): JSX.Element {
  const colors = useSporeColors()
  const alertColor = getAlertColor(severity)
  const alertColorValue = alertColor.headerText as keyof typeof colors

  return (
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
          {icon ?? <AlertTriangleFilled color={alertColor.headerText} size="$icon.24" />}
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
      {(rejectText || acknowledgeText) && (
        <Flex row alignSelf="stretch" gap="$spacing12" pt={children ? '$spacing12' : '$spacing24'}>
          {rejectText && (
            <Trace logPress element={ElementName.BackButton} modal={modalName} properties={analyticsProperties}>
              <Button emphasis="secondary" onPress={onReject ?? onClose}>
                {rejectText}
              </Button>
            </Trace>
          )}
          {acknowledgeText && (
            <Trace logPress element={ElementName.Confirm} modal={modalName} properties={analyticsProperties}>
              <Button testID={TestID.Confirm} onPress={onAcknowledge}>
                {acknowledgeText}
              </Button>
            </Trace>
          )}
        </Flex>
      )}
    </Flex>
  )
}

export function WarningModal(props: PropsWithChildren<WarningModalProps>): JSX.Element {
  const { hideHandlebar, isDismissible = true, isOpen, maxWidth, modalName, onClose } = props
  const colors = useSporeColors()

  const swapFormContext = useContext(SwapFormContext)

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
      {swapFormContext ? (
        // When we render this modal inside the swap flow, we want to forward the context so that it's available inside the modal's Portal.
        <SwapFormContext.Provider value={swapFormContext}>
          <WarningModalContent {...props} />
        </SwapFormContext.Provider>
      ) : (
        <WarningModalContent {...props} />
      )}
    </Modal>
  )
}
