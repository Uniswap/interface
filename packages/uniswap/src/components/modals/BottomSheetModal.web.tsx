import { pick } from 'lodash'
import { ComponentProps, useEffect, useState } from 'react'
import { Flex, Portal, Sheet } from 'ui/src'
import { validColor, zIndices } from 'ui/src/theme'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { BottomSheetContextProvider } from 'uniswap/src/components/modals/BottomSheetContext'
import { BottomSheetModalProps } from 'uniswap/src/components/modals/BottomSheetModalProps'
import { useUpdateScrollLock } from 'uniswap/src/components/modals/ScrollLock'
import Trace from 'uniswap/src/features/telemetry/Trace'

export type WebBottomSheetProps = Pick<
  BottomSheetModalProps,
  | 'children'
  | 'name'
  | 'onClose'
  | 'fullScreen'
  | 'backgroundColor'
  | 'isDismissible'
  | 'isModalOpen'
  | 'alignment'
  | 'maxWidth'
  | 'padding'
>

export function BottomSheetModal(props: BottomSheetModalProps): JSX.Element {
  const supportedProps = pick(props, [
    'name',
    'onClose',
    'fullScreen',
    'backgroundColor',
    'children',
    'isDismissible',
    'isModalOpen',
    'alignment',
    'maxWidth',
    'padding',
  ])

  if (props.alignment === 'top') {
    // we can't really use a sheet for top alignment as its designed for being attached to bottom
    return <WebTopSheetModal {...supportedProps} />
  }

  return <WebBottomSheetModal {...supportedProps} />
}

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
    'alignment',
    'maxWidth',
    'padding',
  ])

  return <WebBottomSheetModal {...supportedProps} />
}

function WebTopSheetModal({
  children,
  onClose,
  backgroundColor,
  isDismissible = true,
  isModalOpen = true,
  maxWidth,
  padding = '$spacing12',
}: WebBottomSheetProps): JSX.Element {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => setIsMounted(true), [])

  useUpdateScrollLock({ isModalOpen })

  return (
    <Portal zIndex={zIndices.modal}>
      <Flex
        inset={0}
        maxWidth={maxWidth}
        p={padding}
        pointerEvents="none"
        position="absolute"
        {...(isModalOpen && {
          pointerEvents: 'auto',
        })}
      >
        {/* backdrop */}
        <Flex
          animation="300ms"
          backgroundColor="$scrim"
          inset={0}
          opacity={0}
          position="absolute"
          zIndex={0}
          onPress={isDismissible ? onClose : null}
          {...(isModalOpen &&
            isMounted && {
              opacity: 1,
            })}
        />

        {/* sheet */}
        <Flex
          animation="quicker"
          backgroundColor={backgroundColor ? validColor(backgroundColor) : '$surface1'}
          borderRadius="$rounded24"
          flexShrink={1}
          opacity={0}
          p="$spacing12"
          y={-20}
          {...(isModalOpen &&
            isMounted && {
              opacity: 1,
              y: 0,
            })}
        >
          {/*
            To keep this consistent with how the `BottomSheetModal` works on native mobile, we only mount the children when the modal is open.
            It is critical for the modal to work this way or else it breaks existing assumptions throughout our codebase about when components are mounted / unmounted.
          */}
          {isModalOpen ? children : null}
        </Flex>
      </Flex>
    </Portal>
  )
}

const ANIMATION_MS = 200

function WebBottomSheetModal({
  children,
  name,
  onClose,
  fullScreen,
  backgroundColor,
  isDismissible = true,
  isModalOpen = true,
  alignment = 'center',
  maxWidth,
  padding = '$spacing12',
}: WebBottomSheetProps): JSX.Element {
  const [fullyClosed, setFullyClosed] = useState(false)

  if (fullyClosed && isModalOpen) {
    setFullyClosed(false)
  }

  useUpdateScrollLock({ isModalOpen })

  // Not the greatest, we are syncing 200 here to 200ms animation
  // TODO(EXT-745): Add Tamagui onFullyClosed callback and replace here
  useEffect(() => {
    if (!isModalOpen) {
      const tm = setTimeout(() => {
        setFullyClosed(true)
      }, ANIMATION_MS)

      return () => {
        clearTimeout(tm)
      }
    }
  }, [isModalOpen])

  const isBottomAligned = alignment === 'bottom'

  return (
    <Trace logImpression={isModalOpen} modal={name}>
      <BottomSheetContextProvider isSheetReady={true}>
        <Sheet
          disableDrag
          modal
          animation={`${ANIMATION_MS}ms`}
          dismissOnOverlayPress={false}
          dismissOnSnapToBottom={false}
          open={isModalOpen}
          snapPoints={fullScreen || !isBottomAligned ? [100] : undefined}
          onOpenChange={(open: boolean): void => {
            !open && onClose?.()
          }}
        >
          <Sheet.Overlay
            backgroundColor="$black"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
            height="100%"
            opacity={0.6}
            onPress={(): void => {
              isDismissible && onClose?.()
            }}
          />
          <Sheet.Frame
            alignSelf="center"
            backgroundColor="$transparent"
            flex={1}
            height={fullScreen || !isBottomAligned ? '100%' : undefined}
            justifyContent={alignment === 'center' ? 'center' : alignment === 'top' ? 'flex-start' : 'flex-end'}
            maxWidth={maxWidth}
            p={padding}
            pointerEvents="none"
          >
            <Flex
              backgroundColor={backgroundColor ? validColor(backgroundColor) : '$surface1'}
              borderRadius="$rounded24"
              p="$spacing12"
              pointerEvents="auto"
              width="100%"
            >
              {/*
                To keep this consistent with how the `BottomSheetModal` works on native mobile, we only mount the children when the modal is open.
                It is critical for the modal to work this way or else it breaks existing assumptions throughout our codebase about when components are mounted / unmounted.
              */}
              {fullyClosed ? null : children}
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
