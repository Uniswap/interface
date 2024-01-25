import { pick } from 'lodash'
import { ComponentProps, forwardRef } from 'react'
import { Flex, Sheet } from 'ui/src'
import { Trace } from 'utilities/src/telemetry/trace/Trace'
import { TextInput } from 'wallet/src/components/input/TextInput'
import { BottomSheetContextProvider } from 'wallet/src/components/modals/BottomSheetContext'
import {
  BottomSheetModalProps,
  BottomSheetModalRef,
} from 'wallet/src/components/modals/BottomSheetModalProps'

export type WebBottomSheetProps = Pick<
  BottomSheetModalProps,
  | 'children'
  | 'name'
  | 'onClose'
  | 'fullScreen'
  | 'backgroundColor'
  | 'isModalOpen'
  | 'isDismissible'
>

export const BottomSheetModal = forwardRef<BottomSheetModalRef, BottomSheetModalProps>(
  function _BottomSheetModal(props: BottomSheetModalProps): JSX.Element {
    const supportedProps = pick(props, [
      'name',
      'onClose',
      'fullScreen',
      'backgroundColor',
      'isModalOpen',
      'children',
      'isDismissible',
    ])

    return <WebBottomSheetModal {...supportedProps} />
  }
)

// No detached mode necessary yet in web
export function BottomSheetDetachedModal(props: BottomSheetModalProps): JSX.Element {
  const supportedProps = pick(props, [
    'name',
    'onClose',
    'fullScreen',
    'backgroundColor',
    'isModalOpen',
    'children',
    'isDismissible',
  ])

  return <WebBottomSheetModal {...supportedProps} />
}

function WebBottomSheetModal({
  children,
  name,
  isModalOpen = true,
  onClose,
  fullScreen,
  backgroundColor,
  isDismissible = true,
}: WebBottomSheetProps): JSX.Element {
  return (
    <Trace logImpression={isModalOpen} modal={name}>
      <BottomSheetContextProvider isSheetReady={true}>
        <Sheet
          disableDrag
          modal
          animation="200ms"
          dismissOnOverlayPress={false}
          dismissOnSnapToBottom={false}
          open={isModalOpen}
          onOpenChange={(open: boolean): void => {
            !open && onClose?.()
          }}>
          <Sheet.Overlay
            animation="lazy"
            backgroundColor="$transparent"
            height="100%"
            // eslint-disable-next-line react-native/no-inline-styles
            style={{ backdropFilter: 'blur(6px)' }}
            onPress={(): void => {
              isDismissible && onClose?.()
            }}
          />
          <Sheet.Frame
            backgroundColor="$transparent"
            flex={1}
            justifyContent="flex-end"
            padding="$spacing12">
            <Flex
              borderRadius="$rounded24"
              height={fullScreen ? '100%' : undefined}
              p="$spacing12"
              shadowColor="$neutral3"
              shadowOpacity={0.04}
              shadowRadius="$spacing12"
              style={{ backgroundColor }}
              width="100%">
              {children}
            </Flex>
          </Sheet.Frame>
        </Sheet>
      </BottomSheetContextProvider>
    </Trace>
  )
}

export function BottomSheetTextInput(props: ComponentProps<typeof TextInput>): JSX.Element {
  return <TextInput {...props} />
}
