import { ParentSheetContext } from '@tamagui/sheet'
import { isWebApp } from '@universe/environment'
import { type PropsWithChildren, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { createContext, useContext, useMemo } from 'react'
import type { DimensionValue } from 'react-native'
import {
  Adapt,
  Dialog,
  type GetProps,
  Sheet,
  styled,
  useIsTouchDevice,
  useMedia,
  type View,
  VisuallyHidden,
} from 'tamagui'
import { type CloseIconProps, CloseIconWithHover } from 'ui/src/components/icons/CloseIconWithHover'
import { Flex, type FlexProps } from 'ui/src/components/layout'
import { RemoveScroll } from 'ui/src/components/RemoveScroll/RemoveScroll'
import { useScrollbarStyles } from 'ui/src/styles/ScrollbarStyles'
import { INTERFACE_NAV_HEIGHT, zIndexes } from 'ui/src/theme'
import { useShadowPropsShort } from 'ui/src/theme/shadows'

export const ADAPTIVE_MODAL_ANIMATION_DURATION = 200

/**
 * Provides the effective z-index of the current modal/sheet/overlay layer so descendants stack above it.
 * Consumed by `Tooltip.Content`, `AdaptiveWebPopoverContent`, `AdaptiveWebModal`,
 * `WebModalWithBottomAttachment`, and standalone `WebBottomSheet` — each renders one layer above
 * (via {@link stackingLayerAbove}) and re-provides the bumped value to its own descendants.
 *
 * Set explicitly by the dapp-request queue at `zIndexes.overlay` so any modal nested inside it
 * (e.g. `NetworkCostEditorModal`) automatically stacks above without per-call-site z-index plumbing.
 */
export const EffectiveModalOrSheetZIndexContext = createContext<number | undefined>(undefined)

/** One layer above a host (modal, popover, overlay), with a minimum floor for the stacking scale. */
export function stackingLayerAbove(hostZIndex: number | undefined, floor: number): number {
  return Math.max((hostZIndex ?? 0) + 1, floor)
}

/**
 * Z-index for {@link EffectiveModalOrSheetZIndexContext} in adaptive modals: matches Tamagui sheet stacking when
 * the modal uses the bottom-sheet adapt branch (`Adapt when="md"`), otherwise the dialog portal layer.
 */
export function useEffectiveModalOrSheetZIndex({
  adaptToSheet,
  isTopAligned,
  zIndex,
}: {
  adaptToSheet: boolean
  isTopAligned: boolean
  zIndex?: number
}): number | undefined {
  const media = useMedia()
  const parentSheet = useContext(ParentSheetContext)
  const parentContextZ = useContext(EffectiveModalOrSheetZIndexContext)
  return useMemo((): number | undefined => {
    if (adaptToSheet && !isTopAligned && media.md) {
      // Prefer Tamagui's nested-sheet stacking when we're inside a parent sheet; otherwise fall back to
      // the React-managed modal/overlay context so sheets opened from inside an overlay (extension dapp
      // request, etc.) still stack above their host.
      // oxlint-disable-next-line typescript/no-unnecessary-condition -- biome-parity: oxlint is stricter here
      const parentHostZ = parentSheet.zIndex ?? parentContextZ
      return stackingLayerAbove(parentHostZ, zIndexes.modal)
    }
    return zIndex ?? stackingLayerAbove(parentContextZ, zIndexes.modal)
  }, [adaptToSheet, isTopAligned, media.md, zIndex, parentSheet.zIndex, parentContextZ])
}

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
  snapPointsMode = 'fit',
  snapPoints,
  disableRemoveScroll = false,
  ...rest
}: ModalProps): JSX.Element | null {
  const isTouchDevice = useIsTouchDevice()
  const [isHandlePressed, setHandlePressed] = useState(false)
  const parentContextZ = useContext(EffectiveModalOrSheetZIndexContext)
  const effectiveZIndex = rest.zIndex ?? stackingLayerAbove(parentContextZ, zIndexes.modal)

  // TODO(INFRA-644): Remove this workaround once Tamagui sheet bug is fixed
  // Force a new key to remount the Sheet on touch devices on sheet close
  // This is a workaround for bug where sheet does not respect disableDrag value changes unless remounted
  const touchDeviceSheetKey = useIncrementTouchDeviceSheetKey({ isOpen, isTouchDevice })

  // TODO(WEB-6258): Token selector not rendering bottom sheet on web without this workaround
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Delay enabling overlay dismiss to prevent the same tap that opens the sheet from immediately closing it.
  // On mobile web, a tap generates mousedown -> mouseup -> click in quick succession.
  // Without this delay, the mouseup/click from the opening tap hits the overlay and triggers dismiss.
  // We wait for the animation to complete before enabling dismiss.
  const [canDismissOnOverlayPress, setCanDismissOnOverlayPress] = useState(false)
  useEffect(() => {
    if (isOpen) {
      const timeout = setTimeout(() => {
        setCanDismissOnOverlayPress(true)
      }, ADAPTIVE_MODAL_ANIMATION_DURATION)
      return () => clearTimeout(timeout)
    }
    setCanDismissOnOverlayPress(false)
    return undefined
  }, [isOpen])

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

  // Only calculate sheetHeightStyles if not using percent mode
  const sheetHeightStyles: FlexProps | undefined =
    snapPointsMode !== 'percent'
      ? {
          height: rest.$md?.['$platform-web']?.height as DimensionValue,
          maxHeight: (isWebApp
            ? `calc(100vh - ${INTERFACE_NAV_HEIGHT}px)`
            : (rest.$md?.['$platform-web']?.maxHeight ?? '100dvh')) as DimensionValue,
        }
      : undefined

  if (!mounted) {
    return null
  }

  return (
    <RemoveScroll enabled={isOpen && !disableRemoveScroll}>
      <Sheet
        key={touchDeviceSheetKey}
        dismissOnSnapToBottom
        modal
        dismissOnOverlayPress={canDismissOnOverlayPress}
        animation="200ms"
        disableDrag={isTouchDevice && !isHandlePressed}
        open={isOpen}
        snapPointsMode={snapPointsMode}
        // Must be spread because setting snapPoints to undefined still changes behavior
        {...(snapPoints && { snapPoints })}
        zIndex={effectiveZIndex}
        onOpenChange={handleClose}
      >
        <Sheet.Frame
          flex={1}
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
          <Flex
            flex={1}
            gap={gap}
            $platform-web={{ overflow: 'auto' }}
            {...sheetHeightStyles}
            onPress={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
          >
            {/* Self-provide the depth context so floating descendants (tooltips, popovers) auto-stack
                above the sheet even when WebBottomSheet is used standalone (i.e. not via AdaptiveWebModal,
                which already wraps Adapt.Contents in its own Provider that shadows this one). */}
            <EffectiveModalOrSheetZIndexContext.Provider value={effectiveZIndex}>
              {children}
            </EffectiveModalOrSheetZIndexContext.Provider>
          </Flex>
        </Sheet.Frame>
        <Sheet.Overlay
          zIndex={zIndexes.modalBackdrop}
          animation="lazy"
          backgroundColor="$scrim"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          onPress={(e) => {
            e.stopPropagation()
          }}
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
    snapPointsMode?: GetProps<typeof Sheet>['snapPointsMode']
    snapPoints?: GetProps<typeof Sheet>['snapPoints']
    overlayOpacity?: number
    borderColor?: string
    zIndex?: number
    disableRemoveScroll?: boolean // skips Tamagui's built-in RemoveScroll for self-locking callers
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
  borderColor,
  overlayOpacity,
  snapPointsMode,
  snapPoints,
  disableRemoveScroll = false,
  ...rest
}: ModalProps): JSX.Element {
  const filteredRest = Object.fromEntries(Object.entries(rest).filter(([_, v]) => v !== undefined)) as typeof rest // Filter out undefined properties from rest
  const scrollbarStyles = useScrollbarStyles()
  const isTopAligned = alignment === 'top'
  const effectiveZIndex = useEffectiveModalOrSheetZIndex({ adaptToSheet, isTopAligned, zIndex })

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
    <Dialog modal open={isOpen} disableRemoveScroll={disableRemoveScroll} onOpenChange={handleClose}>
      <VisuallyHidden>
        <Dialog.Title />
      </VisuallyHidden>
      {adaptToSheet && !isTopAligned && ( // Tamagui Sheets always animate in from the bottom, so we cannot use Sheets on top aligned modals
        <Adapt when="md">
          <WebBottomSheet
            isOpen={isOpen}
            gap={gap ?? '$spacing4'}
            px={px ?? p ?? '$spacing24'}
            py={py ?? p ?? '$spacing16'}
            style={style}
            hideHandlebar={hideHandlebar}
            snapPointsMode={snapPointsMode}
            snapPoints={snapPoints}
            zIndex={effectiveZIndex}
            disableRemoveScroll={disableRemoveScroll}
            onClose={onClose}
            {...filteredRest}
          >
            <EffectiveModalOrSheetZIndexContext.Provider value={effectiveZIndex}>
              <Adapt.Contents />
            </EffectiveModalOrSheetZIndexContext.Provider>
          </WebBottomSheet>
        </Adapt>
      )}

      <Dialog.Portal zIndex={effectiveZIndex}>
        <Overlay key="overlay" {...(overlayOpacity !== undefined && { opacity: overlayOpacity })} />
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
            borderColor={borderColor ?? '$surface3'}
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
            <EffectiveModalOrSheetZIndexContext.Provider value={effectiveZIndex}>
              {children}
            </EffectiveModalOrSheetZIndexContext.Provider>
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
  borderColor,
  overlayOpacity,
  snapPointsMode,
  snapPoints,
  disableRemoveScroll = false,
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
  const effectiveZIndex = useEffectiveModalOrSheetZIndex({ adaptToSheet, isTopAligned, zIndex })

  return (
    <Dialog modal open={isOpen} disableRemoveScroll={disableRemoveScroll} onOpenChange={handleClose}>
      <VisuallyHidden>
        <Dialog.Title />
      </VisuallyHidden>
      {adaptToSheet && !isTopAligned && ( // Tamagui Sheets always animate in from the bottom, so we cannot use Sheets on top aligned modals
        <Adapt when="md">
          <WebBottomSheet
            isOpen={isOpen}
            style={style}
            hideHandlebar={hideHandlebar}
            snapPointsMode={snapPointsMode}
            snapPoints={snapPoints}
            zIndex={effectiveZIndex}
            disableRemoveScroll={disableRemoveScroll}
            onClose={onClose}
            {...filteredRest}
          >
            <EffectiveModalOrSheetZIndexContext.Provider value={effectiveZIndex}>
              <Adapt.Contents />
            </EffectiveModalOrSheetZIndexContext.Provider>
          </WebBottomSheet>
        </Adapt>
      )}

      <Dialog.Portal zIndex={effectiveZIndex}>
        <Overlay key="overlay" {...(overlayOpacity !== undefined && { opacity: overlayOpacity })} />

        <Dialog.Content
          key="content"
          elevate
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
            <EffectiveModalOrSheetZIndexContext.Provider value={effectiveZIndex}>
              <Flex
                {...shadowProps}
                backgroundColor={backgroundColor}
                borderColor={borderColor ?? '$surface3'}
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
            </EffectiveModalOrSheetZIndexContext.Provider>
          </Flex>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
