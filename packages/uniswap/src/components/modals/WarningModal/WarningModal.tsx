import { PropsWithChildren, ReactNode, useContext } from 'react'
import type { ColorValue } from 'react-native'
import { Button, Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { opacify } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { getAlertColor } from 'uniswap/src/components/modals/WarningModal/getAlertColor'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { SwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isMobileApp, isWeb } from 'utilities/src/platform'

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
  fullScreen?: boolean
}

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
      height="$spacing48"
      width="$spacing48"
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
  fullScreen,
}: PropsWithChildren<WarningModalContentProps>): JSX.Element {
  const { headerText: alertHeaderTextColor } = getAlertColor(severity)

  const buttonSize = isMobileApp ? 'medium' : fullScreen ? 'medium' : 'small'

  return (
    <Flex
      centered
      flex={fullScreen ? 1 : 0}
      gap="$spacing12"
      maxWidth={maxWidth}
      pb={isWeb ? '$none' : '$spacing12'}
      pt={hideHandlebar ? '$spacing24' : '$spacing12'}
      px={isWeb ? '$none' : '$spacing24'}
      justifyContent={fullScreen ? 'space-between' : 'unset'}
    >
      <Flex>
        {fullScreen && (
          <TouchableArea alignItems="flex-start" pb="$spacing12" onPress={onReject ?? onClose}>
            <BackArrow color="$neutral2" size="$icon.24" />
          </TouchableArea>
        )}
        <Flex centered gap="$spacing12">
          <WarningModalIcon
            hideIcon={hideIcon}
            icon={icon}
            backgroundIconColor={backgroundIconColor}
            alertHeaderTextColor={alertHeaderTextColor}
          />

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
        </Flex>
      </Flex>

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
              <Button size={buttonSize} testID={TestID.Confirm} onPress={onAcknowledge}>
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
  const { hideHandlebar, isDismissible = true, isOpen, maxWidth, modalName, onClose, zIndex, fullScreen } = props
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
      zIndex={zIndex}
      fullScreen={fullScreen}
      onClose={onClose}
    >
      {swapFormContext ? (
        <SwapFormContext.Provider value={swapFormContext}>
          <WarningModalContent {...props} />
        </SwapFormContext.Provider>
      ) : (
        <WarningModalContent {...props} />
      )}
    </Modal>
  )
}
