import * as DialogPrimitive from '@radix-ui/react-dialog'
import { isWebApp } from '@universe/environment'
import { Flex, type FlexProps } from '@universe/mycelium'
import { OVERLAY_PORTAL_CONTAINER_ATTRIBUTE } from '@universe/mycelium/popover-compat'
// The compat useMedia evaluates the same `ui/src/theme/media.ts` breakpoints (max-width,
// desktop-first) through an SSR-safe matchMedia store, so the sheet-adapt/close-icon
// thresholds keep their exact legacy values.
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { type ReactNode, useCallback, useContext, useMemo } from 'react'
import { type CloseIconProps, CloseIconWithHover } from 'ui/src/components/icons/CloseIconWithHover'
import {
  FIXED_FULL_SCREEN,
  getOutsideEventTarget,
  MODAL_STYLESHEET,
  type OutsideInteractionEvent,
  useChromeNodeRef,
  useRestoreFocusOnClose,
  VISUALLY_HIDDEN_STYLE,
} from 'ui/src/components/modal/AdaptiveWebModalInternals.web'
import type { ModalProps } from 'ui/src/components/modal/AdaptiveWebModalShared'
import {
  DualZIndexProvider,
  EffectiveModalOrSheetZIndexContext,
  stackingLayerAbove,
} from 'ui/src/components/modal/AdaptiveWebModalShared'
import { WebBottomSheet } from 'ui/src/components/modal/WebBottomSheet.web'
import { RemoveScroll } from 'ui/src/components/RemoveScroll/RemoveScroll'
import { useScrollbarStyles } from 'ui/src/styles/ScrollbarStyles'
import { zIndexes } from 'ui/src/theme'
import { useShadowPropsShort } from 'ui/src/theme/shadows'
import { useInjectSingleStylesheet } from 'utilities/src/react/useInjectSingleStylesheet'

export {
  ADAPTIVE_MODAL_ANIMATION_DURATION,
  DualZIndexProvider,
  EffectiveModalOrSheetZIndexContext,
  stackingLayerAbove,
  WEB_BOTTOM_SHEET_OVERLAY_TEST_ID,
} from 'ui/src/components/modal/AdaptiveWebModalShared'
export { WebBottomSheet } from 'ui/src/components/modal/WebBottomSheet.web'

/**
 * Z-index for {@link EffectiveModalOrSheetZIndexContext} in adaptive modals: the bottom-sheet
 * adapt branch and the dialog portal layer both stack one layer above the hosting modal/overlay
 * context. Nested sheets coordinate exclusively through {@link EffectiveModalOrSheetZIndexContext}.
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
  const isSheetBreakpoint = useMedia().md
  const parentContextZ = useContext(EffectiveModalOrSheetZIndexContext)
  return useMemo((): number | undefined => {
    if (adaptToSheet && !isTopAligned && isSheetBreakpoint) {
      // Sheets stack above their host (extension dapp request overlay, parent modal, etc.)
      // regardless of any explicit zIndex, matching the previous nested-sheet stacking.
      return stackingLayerAbove(parentContextZ, zIndexes.modal)
    }
    return zIndex ?? stackingLayerAbove(parentContextZ, zIndexes.modal)
  }, [adaptToSheet, isTopAligned, isSheetBreakpoint, zIndex, parentContextZ])
}

export function ModalCloseIcon(props: CloseIconProps): JSX.Element {
  // hide close icon on bottom sheet on interface
  const sm = useMedia().sm
  const hideCloseIcon = isWebApp && sm
  return hideCloseIcon ? <></> : <CloseIconWithHover {...props} />
}

/**
 * Guards Radix's outside-interaction dismissal: presses on this modal's own chrome (scrim,
 * positioner) dismiss, while interactions with sibling-portaled layers (dropdowns, tooltips
 * rendered outside this dialog's subtree) must not close the modal.
 */
function useOwnChromeDismissGuard(): {
  setOverlayNode: (node: unknown) => void
  setPositionerNode: (node: unknown) => void
  handlePointerDownOutside: (event: OutsideInteractionEvent) => void
  preventOutsideDismiss: (event: OutsideInteractionEvent) => void
} {
  const [overlayRef, setOverlayNode] = useChromeNodeRef()
  const [positionerRef, setPositionerNode] = useChromeNodeRef()

  const handlePointerDownOutside = useCallback(
    (event: OutsideInteractionEvent): void => {
      const target = getOutsideEventTarget(event)
      const isOwnChrome =
        target !== null &&
        (overlayRef.current?.contains(target) === true || positionerRef.current?.contains(target) === true)
      if (!isOwnChrome) {
        event.preventDefault()
      }
    },
    [overlayRef, positionerRef],
  )
  const preventOutsideDismiss = useCallback((event: OutsideInteractionEvent): void => {
    event.preventDefault()
  }, [])

  return { setOverlayNode, setPositionerNode, handlePointerDownOutside, preventOutsideDismiss }
}

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
  sheetFitHeight = 'ratchet',
  disableRemoveScroll = false,
  ...rest
}: ModalProps): JSX.Element {
  useInjectSingleStylesheet(MODAL_STYLESHEET)
  const filteredRest = Object.fromEntries(Object.entries(rest).filter(([_, v]) => v !== undefined)) as typeof rest // Filter out undefined properties from rest
  const scrollbarStyles = useScrollbarStyles()
  const shadowProps = useShadowPropsShort()
  const isTopAligned = alignment === 'top'
  const effectiveZIndex = useEffectiveModalOrSheetZIndex({ adaptToSheet, isTopAligned, zIndex })
  const isSheetBreakpoint = useMedia().md
  const { setOverlayNode, setPositionerNode, handlePointerDownOutside, preventOutsideDismiss } =
    useOwnChromeDismissGuard()
  const { onOpenAutoFocus, onCloseAutoFocus } = useRestoreFocusOnClose()

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

  // Sheets always animate in from the bottom, so we cannot use sheets on top aligned modals
  if (adaptToSheet && !isTopAligned && isSheetBreakpoint) {
    return (
      <WebBottomSheet
        isOpen={isOpen}
        gap={gap ?? '$spacing4'}
        px={px ?? p ?? '$spacing24'}
        py={py ?? p ?? '$spacing16'}
        style={style}
        hideHandlebar={hideHandlebar}
        snapPointsMode={snapPointsMode}
        snapPoints={snapPoints}
        sheetFitHeight={sheetFitHeight}
        zIndex={effectiveZIndex}
        disableRemoveScroll={disableRemoveScroll}
        onClose={onClose}
        {...filteredRest}
      >
        <DualZIndexProvider value={effectiveZIndex}>{children}</DualZIndexProvider>
      </WebBottomSheet>
    )
  }

  const state = isOpen ? 'open' : 'closed'

  return (
    <RemoveScroll enabled={isOpen && !disableRemoveScroll}>
      <DialogPrimitive.Root modal open={isOpen} onOpenChange={handleClose}>
        <DialogPrimitive.Portal>
          {/* pointerEvents auto on overlay + positioner is load-bearing: Radix modal mode sets
              body pointer-events:none while open, so without it the scrim is unhittable and
              scrim-press dismissal is dead in real browsers (jsdom fireEvent bypasses
              hit-testing). The positioner's closed-state animation class is equally load-bearing:
              Radix Presence gates each direct portal child on ITS OWN animationName, and an
              animation-less positioner unmounts instantly on close, taking the exiting content
              (and its exit keyframes) with it. */}
          <Flex
            ref={setOverlayNode}
            className="uw-modal-overlay"
            data-state={state}
            top={0}
            right={0}
            bottom={0}
            left={0}
            zIndex={effectiveZIndex}
            backgroundColor="$scrim"
            opacity={overlayOpacity ?? 0.5}
            pointerEvents="auto"
            $platform-web={FIXED_FULL_SCREEN}
          />
          <Flex
            ref={setPositionerNode}
            className="uw-modal-positioner"
            data-state={state}
            top={0}
            right={0}
            bottom={0}
            left={0}
            zIndex={effectiveZIndex}
            alignItems="center"
            justifyContent="center"
            pointerEvents="auto"
            $platform-web={FIXED_FULL_SCREEN}
          >
            <Flex
              grow
              maxHeight={filteredRest.maxHeight ?? 'calc(100vh - 32px)'}
              borderRadius="$rounded16"
              justifyContent="center"
              overflow="hidden"
              {...topAlignedStyles}
            >
              <DialogPrimitive.Content
                asChild
                aria-describedby={undefined}
                onOpenAutoFocus={onOpenAutoFocus}
                onCloseAutoFocus={onCloseAutoFocus}
                onPointerDownOutside={handlePointerDownOutside}
                onFocusOutside={preventOutsideDismiss}
              >
                {/* Portal target for nested mycelium popovers: keeps their popups inside this
                    dialog's focus trap (SWAP-3309). */}
                <Flex
                  {...{ [OVERLAY_PORTAL_CONTAINER_ATTRIBUTE]: '' }}
                  className={isTopAligned ? 'uw-modal-content-top' : 'uw-modal-content-center'}
                  backgroundColor="$surface1"
                  {...shadowProps}
                  borderColor={borderColor ?? '$surface3'}
                  borderWidth={borderWidth ?? '$spacing1'}
                  borderRadius="$rounded16"
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
                  <DialogPrimitive.Title style={VISUALLY_HIDDEN_STYLE} />
                  <DualZIndexProvider value={effectiveZIndex}>{children}</DualZIndexProvider>
                </Flex>
              </DialogPrimitive.Content>
            </Flex>
          </Flex>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </RemoveScroll>
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
  sheetFitHeight = 'ratchet',
  disableRemoveScroll = false,
  ...rest
}: ModalProps & { bottomAttachment?: ReactNode }): JSX.Element {
  useInjectSingleStylesheet(MODAL_STYLESHEET)
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
  const isSheetBreakpoint = useMedia().md
  const { setOverlayNode, setPositionerNode, handlePointerDownOutside, preventOutsideDismiss } =
    useOwnChromeDismissGuard()
  const { onOpenAutoFocus, onCloseAutoFocus } = useRestoreFocusOnClose()

  // Sheets always animate in from the bottom, so we cannot use sheets on top aligned modals
  if (adaptToSheet && !isTopAligned && isSheetBreakpoint) {
    return (
      <WebBottomSheet
        isOpen={isOpen}
        style={style}
        hideHandlebar={hideHandlebar}
        snapPointsMode={snapPointsMode}
        snapPoints={snapPoints}
        sheetFitHeight={sheetFitHeight}
        zIndex={effectiveZIndex}
        disableRemoveScroll={disableRemoveScroll}
        onClose={onClose}
      >
        <DualZIndexProvider value={effectiveZIndex}>
          {/* Mirrors the dialog branch's inner card + attachment (the old Adapt.Contents
              teleported the same structure into the adapted sheet); rendering bare children here
              dropped the attachment and the card styling at <=md viewports. */}
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
        </DualZIndexProvider>
      </WebBottomSheet>
    )
  }

  const state = isOpen ? 'open' : 'closed'

  return (
    <RemoveScroll enabled={isOpen && !disableRemoveScroll}>
      <DialogPrimitive.Root modal open={isOpen} onOpenChange={handleClose}>
        <DialogPrimitive.Portal>
          {/* pointerEvents auto on overlay + positioner is load-bearing: Radix modal mode sets
              body pointer-events:none while open, so without it the scrim is unhittable and
              scrim-press dismissal is dead in real browsers (jsdom fireEvent bypasses
              hit-testing). The positioner's closed-state animation class is equally load-bearing:
              Radix Presence gates each direct portal child on ITS OWN animationName, and an
              animation-less positioner unmounts instantly on close, taking the exiting content
              (and its exit keyframes) with it. */}
          <Flex
            ref={setOverlayNode}
            className="uw-modal-overlay"
            data-state={state}
            top={0}
            right={0}
            bottom={0}
            left={0}
            zIndex={effectiveZIndex}
            backgroundColor="$scrim"
            opacity={overlayOpacity ?? 0.5}
            pointerEvents="auto"
            $platform-web={FIXED_FULL_SCREEN}
          />
          <Flex
            ref={setPositionerNode}
            className="uw-modal-positioner"
            data-state={state}
            top={0}
            right={0}
            bottom={0}
            left={0}
            zIndex={effectiveZIndex}
            alignItems="center"
            justifyContent="center"
            pointerEvents="auto"
            $platform-web={FIXED_FULL_SCREEN}
          >
            <DialogPrimitive.Content
              asChild
              aria-describedby={undefined}
              onOpenAutoFocus={onOpenAutoFocus}
              onCloseAutoFocus={onCloseAutoFocus}
              onPointerDownOutside={handlePointerDownOutside}
              onFocusOutside={preventOutsideDismiss}
            >
              {/* Same nested-popover portal target as AdaptiveWebModal (SWAP-3309). */}
              <Flex
                {...{ [OVERLAY_PORTAL_CONTAINER_ATTRIBUTE]: '' }}
                className={isTopAligned ? 'uw-attachment-content-top' : 'uw-attachment-content-center'}
                backgroundColor="$transparent"
                maxHeight="calc(100vh - 32px)"
                maxWidth={420}
                overflow="hidden"
                p="$none"
                style={style}
                width="calc(100vw - 32px)"
              >
                <DialogPrimitive.Title style={VISUALLY_HIDDEN_STYLE} />
                <Flex height="100%" width="100%" gap="$spacing8">
                  <DualZIndexProvider value={effectiveZIndex}>
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
                  </DualZIndexProvider>
                </Flex>
              </Flex>
            </DialogPrimitive.Content>
          </Flex>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </RemoveScroll>
  )
}
