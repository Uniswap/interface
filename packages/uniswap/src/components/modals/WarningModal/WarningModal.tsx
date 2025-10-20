import { type PropsWithChildren, type ReactNode, useContext } from 'react'
import type { ColorValue } from 'react-native'
import { Button, Flex, FlexProps, Text, TouchableArea, useSporeColors } from 'ui/src'
import type { ButtonEmphasis, ButtonProps } from 'ui/src/components/buttons/Button/types'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { X } from 'ui/src/components/icons/X'
import { opacify, zIndexes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { getAlertColor } from 'uniswap/src/components/modals/WarningModal/getAlertColor'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import type { ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import type { SwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/createSwapFormStore'
import { SwapFormStoreContext } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/SwapFormStoreContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isMobileApp, isWebPlatform } from 'utilities/src/platform'

export const useMaybeSwapFormStoreBase = (): SwapFormStore | null => useContext(SwapFormStoreContext)

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
  buttonSize?: ButtonProps['size']
  showCloseButton?: boolean
  acknowledgeButtonEmphasis?: ButtonEmphasis
  closeHeaderComponent?: ReactNode
} & FlexProps

export type WarningModalProps = {
  isOpen: boolean
  isDismissible?: boolean
  zIndex?: number
} & WarningModalContentProps

function WarningModalIcon({
  hideIcon,
  icon,
  backgroundIconColor,
  alertHeaderTextColor,
}: {
  hideIcon?: boolean
  icon?: ReactNode
  backgroundIconColor?: ColorValue | false
  alertHeaderTextColor: string
}): JSX.Element | null {
  const colors = useSporeColors()

  if (hideIcon) {
    return null
  }

  return (
    <Flex
      centered
      alignItems="center"
      minHeight="$spacing48"
      minWidth="$spacing48"
      borderRadius="$rounded12"
      mb="$spacing8"
      p={backgroundIconColor === false ? '$none' : '$spacing12'}
      style={
        backgroundIconColor === false
          ? undefined
          : {
              backgroundColor:
                backgroundIconColor ?? opacify(12, colors[alertHeaderTextColor as keyof typeof colors].val),
            }
      }
    >
      {icon ?? <AlertTriangleFilled color={alertHeaderTextColor} size="$icon.24" />}
    </Flex>
  )
}

export function WarningModalContent({
  onClose,
  onReject,
  onAcknowledge,
  modalName,
  title,
  titleComponent,
  caption,
  captionComponent,
  rejectText,
  acknowledgeText,
  severity = WarningSeverity.Medium,
  children,
  icon,
  hideIcon,
  maxWidth,
  hideHandlebar = false,
  backgroundIconColor,
  analyticsProperties,
  buttonSize: passedButtonSize,
  showCloseButton = false,
  acknowledgeButtonEmphasis = 'primary',
  closeHeaderComponent,
  ...props
}: PropsWithChildren<WarningModalContentProps>): JSX.Element {
  const { headerText: alertHeaderTextColor } = getAlertColor(severity)

  const defaultButtonSize = isMobileApp ? 'medium' : 'small'
  const buttonSize = passedButtonSize ?? defaultButtonSize

  return (
    <Flex
      centered
      gap="$spacing12"
      maxWidth={maxWidth}
      pb={isWebPlatform ? '$none' : '$spacing12'}
      pt={hideHandlebar ? '$spacing24' : '$spacing12'}
      px={isWebPlatform ? '$none' : '$spacing24'}
      {...props}
    >
      {showCloseButton && onClose && !closeHeaderComponent && (
        <TouchableArea position="absolute" right={0} top={0} zIndex={zIndexes.default} onPress={onClose}>
          <X color="$neutral2" size="$icon.24" />
        </TouchableArea>
      )}

      {closeHeaderComponent}

      <WarningModalIcon
        hideIcon={hideIcon}
        icon={icon}
        backgroundIconColor={backgroundIconColor}
        alertHeaderTextColor={alertHeaderTextColor}
      />
      {title && (
        <Text textAlign="center" variant={isWebPlatform ? 'subheading2' : 'body1'}>
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
              <Button size={buttonSize} emphasis="secondary" onPress={onReject ?? onClose}>
                {rejectText}
              </Button>
            </Trace>
          )}
          {acknowledgeText && (
            <Trace logPress element={ElementName.Confirm} modal={modalName} properties={analyticsProperties}>
              <Button
                size={buttonSize}
                emphasis={acknowledgeButtonEmphasis}
                testID={TestID.Confirm}
                onPress={onAcknowledge}
              >
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
  const { hideHandlebar, isDismissible = true, isOpen, maxWidth, modalName, onClose, zIndex } = props
  const colors = useSporeColors()

  const maybeSwapFormStore = useMaybeSwapFormStoreBase()

  return (
    <Modal
      backgroundColor={colors.surface1.val}
      hideHandlebar={hideHandlebar}
      isDismissible={isDismissible}
      isModalOpen={isOpen}
      maxWidth={maxWidth}
      name={modalName}
      zIndex={zIndex}
      onClose={onClose}
    >
      {/* TODO: WALL-7198 */}
      {maybeSwapFormStore ? (
        <SwapFormStoreContext.Provider value={maybeSwapFormStore}>
          <WarningModalContent {...props} />
        </SwapFormStoreContext.Provider>
      ) : (
        <WarningModalContent {...props} />
      )}
    </Modal>
  )
}
