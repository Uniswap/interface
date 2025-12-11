import { RemoveScroll } from '@tamagui/remove-scroll'
import { PropsWithChildren, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { DimensionValue } from 'react-native'
import { Adapt, Dialog, GetProps, Sheet, styled, useIsTouchDevice, useMedia, View, VisuallyHidden } from 'tamagui'
import { CloseIconProps, CloseIconWithHover } from 'ui/src/components/icons/CloseIconWithHover'
import { Flex, FlexProps } from 'ui/src/components/layout'
import { useScrollbarStyles } from 'ui/src/styles/ScrollbarStyles'
import { INTERFACE_NAV_HEIGHT, zIndexes } from 'ui/src/theme'
import { useShadowPropsShort } from 'ui/src/theme/shadows'
import { isWebApp } from 'utilities/src/platform'

export const ADAPTIVE_MODAL_ANIMATION_DURATION = 200

export function ModalCloseIcon(props: CloseIconProps): JSX.Element {
  // hide close icon on bottom sheet on interface
  const sm = useMedia().sm
  const hideCloseIcon = isWebApp && sm
  return hideCloseIcon ? <></> : <CloseIconWithHover {...props} />
}

const useIncrementTouchDeviceSheetKey = ({
  isOpen,
  isTouchDevice,
}: {
  isOpen: boolean
  isTouchDevice: boolean
}): number => {
  const prevIsOpenRef = useRef(isOpen)
  const [sheetKey, setSheetKey] = useState(0)

  useEffect(() => {
    if (!isTouchDevice) {
      return
    }
    // Only increment sheetKey when transitioning from open to closed
    if (prevIsOpenRef.current && !isOpen) {
      setSheetKey((prev) => prev + 1)
    }
    prevIsOpenRef.current = isOpen
  }, [isOpen, isTouchDevice])

  return sheetKey
}

export function WebBottomSheet({
  isOpen,
  onClose,
  children,
  gap,
  hideHandlebar,
  ...rest
}: ModalProps): JSX.Element | null {
  const isTouchDevice = useIsTouchDevice()
  const [isHandlePressed, setHandlePressed] = useState(false)

  // TODO(INFRA-644): Remove this workaround once Tamagui sheet bug is fixed
  // Force a new key to remount the Sheet on touch devices on sheet close
  // This is a workaround for bug where sheet does not respect disableDrag value changes unless remounted
  const touchDeviceSheetKey = useIncrementTouchDeviceSheetKey({ isOpen, isTouchDevice })

  // TODO(WEB-6258): Token selector not rendering bottom sheet on web without this workaround
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open && onClose) {
        onClose()
      }
    },
    [onClose],
  )

  const sheetOverrideStyles: FlexProps = {
    ...(rest as FlexProps),
    width: '100%',
    maxWidth: '100%',
    minWidth: '100%',
  }

  const sheetHeightStyles: FlexProps = {
    flex: 1,
    height: rest.$sm?.['$platform-web']?.height as DimensionValue,
    maxHeight: isWebApp
      ? `calc(100vh - ${INTERFACE_NAV_HEIGHT}px)`
      : ((rest.$sm?.['$platform-web']?.maxHeight ?? '100dvh') as DimensionValue),
  }

  if (!mounted) {
    return null
  }

  return (
    <RemoveScroll enabled={isOpen}>
      <Sheet
        key={touchDeviceSheetKey}
        dismissOnOverlayPress
        dismissOnSnapToBottom
        modal
        animation="200ms"
        disableDrag={isTouchDevice && !isHandlePressed}
        open={isOpen}
        snapPointsMode="fit"
        onOpenChange={handleClose}
      >
        <Sheet.Frame
          borderBottomWidth="$none"
          borderColor="$surface3"
          borderTopLeftRadius="$rounded16"
          borderTopRightRadius="$rounded16"
          borderWidth="$spacing1"
          px="$spacing8"
          {...sheetOverrideStyles}
          {...sheetHeightStyles}
        >
          {!hideHandlebar && (
            <Sheet.Handle
              justifyContent="center"
              m={0}
              pb="$spacing16"
              pt="$spacing8"
              width="100%"
              backgroundColor="$transparent"
              onMouseDown={() => setHandlePressed(true)}
              onMouseUp={() => setHandlePressed(false)}
            >
              <Flex backgroundColor="$neutral3" height="$spacing4" width="$spacing32" borderRadius="$roundedFull" />
            </Sheet.Handle>
          )}
          <Flex gap={gap} $platform-web={{ overflow: 'auto' }} {...sheetHeightStyles}>
            {children}
          </Flex>
        </Sheet.Frame>
        <Sheet.Overlay
          animation="lazy"
          backgroundColor="$scrim"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
      </Sheet>
    </RemoveScroll>
  )
}

const Overlay = styled(Dialog.Overlay, {
  animation: '300ms',
  backgroundColor: '$scrim',
  opacity: 0.5,
  enterStyle: { opacity: 0 },
  exitStyle: { opacity: 0 },
})

Overlay.displayName = 'Overlay'

type ModalProps = GetProps<typeof View> &
  PropsWithChildren<{
    isOpen: boolean
    onClose?: () => void
    adaptToSheet?: boolean
    alignment?: 'center' | 'top'
    hideHandlebar?: boolean
  }>

/**
 * AdaptiveWebModal is a responsive modal component that adapts to different screen sizes.
 * On larger screens, it renders as a dialog modal.
 * On smaller screens (mobile devices), it adapts into a bottom sheet.
 */
export function AdaptiveWebModal({
  isOpen,
  onClose,
  children,
  adaptToSheet = true,
  style,
  alignment = 'center',
  gap,
  px,
  py,
  p,
  zIndex,
  hideHandlebar,
  borderWidth,
  ...rest
}: ModalProps): JSX.Element {
  const filteredRest = Object.fromEntries(Object.entries(rest).filter(([_, v]) => v !== undefined)) // Filter out undefined properties from rest
  const scrollbarStyles = useScrollbarStyles()
  const isTopAligned = alignment === 'top'

  const topAlignedStyles: FlexProps = isTopAligned
    ? {
        position: 'absolute',
        justifyContent: 'flex-start',
        top: '$spacing16',
      }
    : {}

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open && onClose) {
        onClose()
      }
    },
    [onClose],
  )

  return (
    <Dialog modal open={isOpen} onOpenChange={handleClose}>
      <VisuallyHidden>
        <Dialog.Title />
      </VisuallyHidden>
      {adaptToSheet &&
        !isTopAligned && ( // Tamagui Sheets always animate in from the bottom, so we cannot use Sheets on top aligned modals
          <Adapt when="md">
            <WebBottomSheet
              isOpen={isOpen}
              gap={gap ?? '$spacing4'}
              px={px ?? p ?? '$spacing24'}
              py={py ?? p ?? '$spacing16'}
              style={style}
              hideHandlebar={hideHandlebar}
              onClose={onClose}
              {...filteredRest}
            >
              <Adapt.Contents />
            </WebBottomSheet>
          </Adapt>
        )}

      <Dialog.Portal zIndex={zIndex ?? zIndexes.modal}>
        <Overlay key="overlay" />
        <Flex
          grow
          maxHeight={filteredRest.maxHeight ?? 'calc(100vh - 32px)'}
          borderRadius="$rounded16"
          justifyContent="center"
          overflow="hidden"
          {...topAlignedStyles}
        >
          <Dialog.Content
            key="content"
            elevate
            bordered={borderWidth !== 0}
            animateOnly={['transform', 'opacity']}
            animation={isOpen ? 'fast' : 'fastExit'}
            borderColor="$surface3"
            borderWidth={borderWidth}
            borderRadius="$rounded16"
            enterStyle={{ x: 0, y: isTopAligned ? -12 : 12, opacity: 0 }}
            exitStyle={{ x: 0, y: isTopAligned ? -12 : 10, opacity: 0 }}
            gap={gap ?? '$spacing4'}
            m="$spacing16"
            maxHeight="calc(100vh - 32px)"
            maxWidth={420}
            $platform-web={{ overflow: 'auto' }}
            px={px ?? p ?? '$spacing24'}
            py={py ?? p ?? '$spacing16'}
            style={Object.assign({}, scrollbarStyles, style)}
            width="calc(100vw - 32px)"
            {...filteredRest}
          >
            {children}
          </Dialog.Content>
        </Flex>
      </Dialog.Portal>
    </Dialog>
  )
}

/**
 * Copy of AdaptiveWebModal with a bottom attachment, used temporarily until we can fully test and adapt to rest of app
 * TODO WALL-5146 Combine this with AdaptiveWebModal and fix for all use cases
 */
export function WebModalWithBottomAttachment({
  isOpen,
  onClose,
  children,
  adaptToSheet = true,
  style,
  alignment = 'center',
  bottomAttachment,
  backgroundColor = '$surface1',
  gap,
  zIndex,
  hideHandlebar,
  borderWidth,
  ...rest
}: ModalProps & { bottomAttachment?: ReactNode }): JSX.Element {
  const shadowProps = useShadowPropsShort()

  const filteredRest = Object.fromEntries(Object.entries(rest).filter(([_, v]) => v !== undefined)) // Filter out undefined properties from rest

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open && onClose) {
        onClose()
      }
    },
    [onClose],
  )

  const isTopAligned = alignment === 'top'

  return (
    <Dialog modal open={isOpen} onOpenChange={handleClose}>
      <VisuallyHidden>
        <Dialog.Title />
      </VisuallyHidden>
      {adaptToSheet &&
        !isTopAligned && ( // Tamagui Sheets always animate in from the bottom, so we cannot use Sheets on top aligned modals
          <Adapt when="md">
            <WebBottomSheet
              isOpen={isOpen}
              style={style}
              hideHandlebar={hideHandlebar}
              onClose={onClose}
              {...filteredRest}
            >
              <Adapt.Contents />
            </WebBottomSheet>
          </Adapt>
        )}

      <Dialog.Portal zIndex={zIndex ?? zIndexes.modal}>
        <Overlay key="overlay" />

        <Dialog.Content
          key="content"
          unstyled
          animateOnly={['transform', 'opacity']}
          animation={isOpen ? 'fastHeavy' : 'fastExitHeavy'}
          backgroundColor="$transparent"
          enterStyle={{ x: 0, y: isTopAligned ? -20 : 20, opacity: 0 }}
          exitStyle={{ x: 0, y: isTopAligned ? -20 : 10, opacity: 0 }}
          maxHeight="calc(100vh - 32px)"
          maxWidth={420}
          overflow="hidden"
          p="$none"
          style={style}
          width="calc(100vw - 32px)"
        >
          <Flex height="100%" width="100%" gap="$spacing8">
            <Flex
              {...shadowProps}
              backgroundColor={backgroundColor}
              borderColor="$surface3"
              borderRadius="$rounded16"
              borderWidth={borderWidth ?? '$spacing1'}
              px="$spacing24"
              py="$spacing16"
              gap={gap ?? '$gap4'}
              overflow="hidden"
              {...filteredRest}
            >
              {children}
            </Flex>
            {bottomAttachment && <Flex>{bottomAttachment}</Flex>}
          </Flex>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
