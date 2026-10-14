import * as DialogPrimitive from '@radix-ui/react-dialog'
import { isTouchable, isWebApp } from '@universe/environment'
import { Flex, type FlexProps } from '@universe/mycelium'
import { useCallback, useContext, useEffect, useState } from 'react'
import {
  FIXED_FULL_SCREEN,
  getPercentFrameStyle,
  markRadixEscapePreventedBySheet,
  MODAL_STYLESHEET,
  getSheetHeightStyles,
  stripConsumerHeightForFit,
  useSheetEscapeToClose,
  useSheetFitHeightFreeze,
  type OutsideInteractionEvent,
  useSheetDrag,
  VISUALLY_HIDDEN_STYLE,
} from 'ui/src/components/modal/AdaptiveWebModalInternals.web'
import type { ModalProps } from 'ui/src/components/modal/AdaptiveWebModalShared'
import {
  ADAPTIVE_MODAL_ANIMATION_DURATION,
  DualZIndexProvider,
  EffectiveModalOrSheetZIndexContext,
  stackingLayerAbove,
  WEB_BOTTOM_SHEET_OVERLAY_TEST_ID,
} from 'ui/src/components/modal/AdaptiveWebModalShared'
import { RemoveScroll } from 'ui/src/components/RemoveScroll/RemoveScroll'
import { INTERFACE_NAV_HEIGHT, zIndexes } from 'ui/src/theme'
import { useInjectSingleStylesheet } from 'utilities/src/react/useInjectSingleStylesheet'
import { useIsMounted } from 'utilities/src/react/useIsMounted'

export function WebBottomSheet({
  isOpen,
  onClose,
  children,
  gap,
  hideHandlebar,
  snapPointsMode = 'fit',
  snapPoints,
  sheetFitHeight = 'ratchet',
  disableRemoveScroll = false,
  ...rest
}: ModalProps): JSX.Element | null {
  useInjectSingleStylesheet(MODAL_STYLESHEET)
  const isTouchDevice = isTouchable
  const parentContextZ = useContext(EffectiveModalOrSheetZIndexContext)
  const effectiveZIndex = rest.zIndex ?? stackingLayerAbove(parentContextZ, zIndexes.modal)
  // The frame node is state (callback ref below), NOT a RefObject: the WEB-6258 mounted gate
  // renders the frame a paint after the hooks first run, so node arrival must re-fire the
  // drag/freeze effects (a ref read inside them would silently never attach on first open).
  const [frameNode, setFrameNode] = useState<HTMLDivElement | null>(null)
  useSheetDrag({ isOpen, isTouchDevice, onClose, frame: frameNode })
  useSheetEscapeToClose({ isOpen, onClose })
  // Ratchet the tallest height. `content` shrinks; percent mode is snap-owned.
  useSheetFitHeightFreeze({
    isOpen,
    enabled: snapPointsMode !== 'percent' && sheetFitHeight !== 'content',
    frame: frameNode,
    isWebApp,
    interfaceNavHeight: INTERFACE_NAV_HEIGHT,
  })

  // TODO(WEB-6258): Token selector not rendering bottom sheet on web without this workaround
  const mounted = useIsMounted()

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

  // The sheet stays force-mounted while closed (Tamagui Sheet parity — consumers rely on closed
  // sheet children keeping DOM/state), so Radix may relay dismiss gestures that reach a closed
  // sheet's layer; ignore those instead of firing consumers' onClose spuriously.
  const handleClose = useCallback(
    (open: boolean) => {
      if (!open && isOpen && onClose) {
        onClose()
      }
    },
    [isOpen, onClose],
  )

  // Tamagui Sheet never moved focus into the sheet; also required with forceMount, where Radix
  // would otherwise run its mount-autofocus while the sheet is still closed and steal page focus.
  const preventAutoFocus = useCallback((event: Event): void => {
    event.preventDefault()
  }, [])

  // Outside-dismiss is owned by the scrim's own press handler below, NOT Radix's outside
  // detection, which is unreliable here on two counts: coexisting force-mounted sheets each
  // preventDefault outside events (vetoing the open sheet's layer event before its onDismiss
  // check), and the touch path defers dismissal to a document-level click that the scrim's
  // required stopPropagation never lets arrive. Always preventing also keeps presses on
  // sibling-portaled layers (dropdowns, tooltips) from closing the sheet.
  const preventOutsideDismiss = useCallback((event: OutsideInteractionEvent): void => {
    event.preventDefault()
  }, [])

  // The scrim is the sole press-to-dismiss surface; stopPropagation keeps scrim presses from
  // leaking through the portal to the sheet's React ancestors.
  const handleOverlayPress = useCallback(
    (event: { stopPropagation: () => void }): void => {
      event.stopPropagation()
      if (canDismissOnOverlayPress && isOpen) {
        onClose?.()
      }
    },
    [canDismissOnOverlayPress, isOpen, onClose],
  )
  // Escape is owned by useSheetEscapeToClose (open-scoped, own stack): Radix's Escape dismissal
  // arbitrates across ALL mounted DismissableLayers, and force-mounted closed sheets would make
  // the last-mounted sheet swallow Escape for every open one. preventDefault here keeps Radix's
  // path inert for sheets in both states.
  const preventRadixEscape = useCallback((event: KeyboardEvent): void => {
    markRadixEscapePreventedBySheet(event)
  }, [])

  // Tamagui compiles height props into classes, so fit mode must strip the consumer height
  // plumbing (top-level and $md.$platform-web) before it reaches the frame — an inline
  // `height: undefined` cannot override a class (see stripConsumerHeightForFit).
  const { '$platform-web': consumerPlatformWeb, ...strippedRest } = stripConsumerHeightForFit(
    rest as FlexProps,
    snapPointsMode,
  )
  const sheetOverrideStyles: FlexProps = {
    ...strippedRest,
    width: '100%',
    maxWidth: '100%',
    minWidth: '100%',
  }
  // Tamagui applied duplicate style props positionally, so a consumer padding prop spread
  // below (via sheetOverrideStyles) overwrote the frame's `px` default. Mycelium compiles the
  // two into `p-[0px]` and `px-[8px]`, which sit in different tailwind-merge groups, so the
  // default survived and re-added 8px per side to sheets that asked for none — NavDropdown
  // passes `p={0}`, and its rows moved in 8px on each edge (INFRA-4019). Resolve the
  // precedence here, in the same `px ?? p ?? default` shape AdaptiveWebModal already uses.
  // Single-side `pl`/`pr` are deliberately not consulted: Tamagui left the other side's
  // default standing, and tailwind emits the longhand after `px-*`, so they already win.
  const framePx =
    strippedRest.px ?? strippedRest.paddingHorizontal ?? strippedRest.p ?? strippedRest.padding ?? '$spacing8'
  // Deep-merged (consumer wins per property) instead of positional: Tamagui whole-value-replaces
  // duplicate props, so either ordering silently dropped one side; the dialog leg orders
  // consumer props last, and the sheet now matches that contract without losing position:fixed.
  const framePlatformWeb = { ...FIXED_FULL_SCREEN, ...(consumerPlatformWeb as object | undefined) }

  const frameStyle = getPercentFrameStyle({
    snapPointsMode,
    snapPoints,
    consumerStyle: strippedRest.style as object | undefined,
  })

  const sheetHeightStyles = getSheetHeightStyles({
    snapPointsMode,
    snapPoints,
    isWebApp,
    interfaceNavHeight: INTERFACE_NAV_HEIGHT,
    mdMaxHeight: rest.$md?.['$platform-web']?.maxHeight as string | number | undefined,
  }) as FlexProps

  if (!mounted) {
    return null
  }

  const state = isOpen ? 'open' : 'closed'

  return (
    <RemoveScroll enabled={isOpen && !disableRemoveScroll}>
      {/* Non-modal + forceMount replicate the previous Tamagui Sheet contract: children stay
          mounted (hidden off-screen) while closed, keeping their DOM and React state. Radix's
          modal mode is incompatible with that — it aria-hides the rest of the app and disables
          body pointer events for as long as the content is *mounted*, not just while open.
          Scroll-lock is handled by the RemoveScroll wrapper above; Tamagui Sheet had no focus
          trap, so non-modal matches the previous focus behavior too. */}
      <DialogPrimitive.Root modal={false} open={isOpen} onOpenChange={handleClose}>
        <DialogPrimitive.Portal forceMount>
          <Flex
            className="uw-sheet-overlay"
            data-state={state}
            testID={WEB_BOTTOM_SHEET_OVERLAY_TEST_ID}
            top={0}
            right={0}
            bottom={0}
            left={0}
            // Scoped to the sheet's effective z, not the global backdrop layer: a nested sheet's
            // scrim must paint ABOVE its host frame (>= host z + 1); the frame wins over the
            // scrim at equal z through DOM order. The old Tamagui portal wrapped overlay+frame
            // in a stacking context at the sheet's z, which Radix's portal does not.
            zIndex={effectiveZIndex}
            backgroundColor="$scrim"
            $platform-web={FIXED_FULL_SCREEN}
            onPress={handleOverlayPress}
          />
          <DialogPrimitive.Content
            ref={setFrameNode}
            asChild
            forceMount
            aria-describedby={undefined}
            onOpenAutoFocus={preventAutoFocus}
            onEscapeKeyDown={preventRadixEscape}
            onPointerDownOutside={preventOutsideDismiss}
            onFocusOutside={preventOutsideDismiss}
          >
            <Flex
              className="uw-sheet-frame"
              left={0}
              right={0}
              bottom={0}
              zIndex={effectiveZIndex}
              backgroundColor="$surface1"
              borderBottomWidth="$none"
              borderColor="$surface3"
              borderTopLeftRadius="$rounded16"
              borderTopRightRadius="$rounded16"
              borderWidth="$spacing1"
              px={framePx}
              {...sheetOverrideStyles}
              {...sheetHeightStyles}
              style={frameStyle}
              $platform-web={framePlatformWeb}
            >
              <DialogPrimitive.Title style={VISUALLY_HIDDEN_STYLE} />
              {!hideHandlebar && (
                <Flex
                  data-sheet-handle
                  justifyContent="center"
                  alignItems="center"
                  m={0}
                  pb="$spacing16"
                  pt="$spacing8"
                  width="100%"
                  backgroundColor="$transparent"
                  cursor="grab"
                  $platform-web={{ touchAction: 'none' }}
                >
                  <Flex backgroundColor="$neutral3" height="$spacing4" width="$spacing32" borderRadius="$roundedFull" />
                </Flex>
              )}
              <Flex
                data-sheet-content
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
                    which already provides the bumped value around its children). */}
                <DualZIndexProvider value={effectiveZIndex}>{children}</DualZIndexProvider>
              </Flex>
            </Flex>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </RemoveScroll>
  )
}
