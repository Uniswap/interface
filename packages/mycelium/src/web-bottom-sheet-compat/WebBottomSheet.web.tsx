// oxlint-disable react/forbid-elements -- the compat chrome IS the raw DOM boundary (no Tamagui Flex here; Radix owns the frame element)
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { isTouchable, isWebApp } from '@universe/environment'
import * as React from 'react'
import { useDisableBodyScroll } from 'utilities/src/react/useDisableBodyScroll'
import { useInjectSingleStylesheet } from 'utilities/src/react/useInjectSingleStylesheet'
import { useIsMounted } from 'utilities/src/react/useIsMounted'
import { markRadixEscapePreventedBySheet, useSheetEscapeToClose } from 'utilities/src/react/useSheetEscapeToClose'
import { cn } from '../cn'
import { mergeCompatStyle } from '../compat/compose'
import { domProps } from '../compat/dom'
import { zIndexValue } from '../compat/style-classes'
import { flexCompatEmission } from '../flex-compat/compile'
import type { FlexCompatProps } from '../flex-compat/props'
import { EffectiveOverlayZIndexContext, OVERLAY_Z_INDEXES, stackingLayerAbove } from '../popover-compat/z-index'
import {
  FIXED_FULL_SCREEN,
  getPercentFrameStyle,
  getSheetHeightStyles,
  INTERFACE_NAV_HEIGHT,
  type OutsideInteractionEvent,
  SHEET_ANIMATION_DURATION,
  SHEET_STYLESHEET,
  stripConsumerHeight,
  useSheetDrag,
  useSheetFitHeightFreeze,
  VISUALLY_HIDDEN_STYLE,
} from './internals'
import { WEB_BOTTOM_SHEET_OVERLAY_TEST_ID, type WebBottomSheetProps } from './props'

const stopPropagation = (event: React.SyntheticEvent): void => event.stopPropagation()

/**
 * Web leg of the WebBottomSheet compat (INFRA-3329): a Tamagui-free, drop-in
 * replacement for `ui/src`'s Radix-based `WebBottomSheet.web.tsx`, rendering
 * the same chrome through the Flex compat emission and coordinating with the
 * legacy sheet through the shared Escape stack in
 * `utilities/src/react/useSheetEscapeToClose`. Stacking rides the mycelium
 * overlay z-index bridge (`EffectiveOverlayZIndexContext`) like every other
 * compat overlay.
 */
export function WebBottomSheet({
  isOpen,
  onClose,
  children,
  gap,
  hideHandlebar,
  snapPointsMode = 'fit',
  snapPoints,
  disableRemoveScroll = false,
  // ModalProps drop-in knobs the standalone sheet never used — dropped here so
  // they don't reach the style emission (the legacy sheet leaked them as inert
  // DOM attributes through the Tamagui frame).
  adaptToSheet: _adaptToSheet,
  alignment: _alignment,
  overlayOpacity: _overlayOpacity,
  ...rest
}: WebBottomSheetProps): React.JSX.Element | null {
  useInjectSingleStylesheet(SHEET_STYLESHEET)
  const parentContextZ = React.useContext(EffectiveOverlayZIndexContext)
  // Resolved through the same token table the emission uses, so the frame's rendered
  // z-index and the effective stacking layer (overlay + descendant context) can never
  // disagree when a caller passes a `$zIndex` token instead of a raw layer number.
  const effectiveZIndex =
    rest.zIndex !== undefined
      ? Number(zIndexValue(rest.zIndex))
      : stackingLayerAbove(parentContextZ, OVERLAY_Z_INDEXES.modal)
  // The frame node is state (callback ref below), NOT a RefObject: the WEB-6258 mounted gate
  // renders the frame a paint after the hooks first run, so node arrival must re-fire the
  // drag/freeze effects (a ref read inside them would silently never attach on first open).
  const [frameNode, setFrameNode] = React.useState<HTMLDivElement | null>(null)
  useSheetDrag({ isOpen, isTouchDevice: isTouchable, onClose, frame: frameNode })
  useSheetEscapeToClose({ isOpen, onClose })
  // Strict Tamagui Sheet parity: fit mode measures the frame once at open and
  // freezes it there; percent mode is owned by the snap point.
  useSheetFitHeightFreeze({
    isOpen,
    enabled: snapPointsMode !== 'percent',
    frame: frameNode,
    isWebApp,
    interfaceNavHeight: INTERFACE_NAV_HEIGHT,
  })
  // The legacy sheet's RemoveScroll wrapper always took the html-overflow lock
  // path for sheets; the hook form keeps the children's tree shape stable.
  useDisableBodyScroll(isOpen && !disableRemoveScroll)

  // TODO(WEB-6258): Token selector not rendering bottom sheet on web without this workaround
  const mounted = useIsMounted()

  // Delay enabling overlay dismiss to prevent the same tap that opens the sheet from immediately closing it.
  // On mobile web, a tap generates mousedown -> mouseup -> click in quick succession.
  // Without this delay, the mouseup/click from the opening tap hits the overlay and triggers dismiss.
  // We wait for the animation to complete before enabling dismiss.
  const [canDismissOnOverlayPress, setCanDismissOnOverlayPress] = React.useState(false)
  React.useEffect(() => {
    if (isOpen) {
      const timeout = setTimeout(() => {
        setCanDismissOnOverlayPress(true)
      }, SHEET_ANIMATION_DURATION)
      return () => clearTimeout(timeout)
    }
    setCanDismissOnOverlayPress(false)
    return undefined
  }, [isOpen])

  // The sheet stays force-mounted while closed (Tamagui Sheet parity — consumers rely on closed
  // sheet children keeping DOM/state), so Radix may relay dismiss gestures that reach a closed
  // sheet's layer; ignore those instead of firing consumers' onClose spuriously.
  const handleClose = React.useCallback(
    (open: boolean) => {
      if (!open && isOpen && onClose) {
        onClose()
      }
    },
    [isOpen, onClose],
  )

  // Tamagui Sheet never moved focus into the sheet; also required with forceMount, where Radix
  // would otherwise run its mount-autofocus while the sheet is still closed and steal page focus.
  const preventAutoFocus = React.useCallback((event: Event): void => {
    event.preventDefault()
  }, [])

  // Outside-dismiss is owned by the scrim's own press handler below, NOT Radix's outside
  // detection, which is unreliable here on two counts: coexisting force-mounted sheets each
  // preventDefault outside events (vetoing the open sheet's layer event before its onDismiss
  // check), and the touch path defers dismissal to a document-level click that the scrim's
  // required stopPropagation never lets arrive. Always preventing also keeps presses on
  // sibling-portaled layers (dropdowns, tooltips) from closing the sheet.
  const preventOutsideDismiss = React.useCallback((event: OutsideInteractionEvent): void => {
    event.preventDefault()
  }, [])

  // The scrim is the sole press-to-dismiss surface; stopPropagation keeps scrim presses from
  // leaking through the portal to the sheet's React ancestors.
  const handleOverlayPress = React.useCallback(
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
  const preventRadixEscape = React.useCallback((event: KeyboardEvent): void => {
    markRadixEscapePreventedBySheet(event)
  }, [])

  // Fit mode must strip the consumer height plumbing (top-level and $md.$platform-web) before it
  // reaches the frame — a media-scoped height class would defeat content-fit sizing (see
  // stripConsumerHeight).
  const { '$platform-web': consumerPlatformWeb, ...strippedRest } = stripConsumerHeight(rest as FlexCompatProps)
  const sheetOverrideStyles: FlexCompatProps = {
    ...strippedRest,
    width: '100%',
    maxWidth: '100%',
    minWidth: '100%',
  }
  // Deep-merged (consumer wins per property) instead of positional: duplicate props
  // whole-value-replace each other, so either ordering silently dropped one side; the legacy
  // dialog leg orders consumer props last, and the sheet matches that contract without losing
  // position:fixed.
  const framePlatformWeb = { ...FIXED_FULL_SCREEN, ...(consumerPlatformWeb as object | undefined) }

  const frameStyle = getPercentFrameStyle({
    snapPointsMode,
    snapPoints,
    // The caller style is the widened CompatStyleProp (RN StyleProp union);
    // this web seam flattens it through the canonical merge — which also owns
    // the dev warnings for dropped RegisteredStyle ids and RN-only keys —
    // before getPercentFrameStyle spreads it as plain CSSProperties.
    consumerStyle: mergeCompatStyle(undefined, strippedRest.style),
  })

  const sheetHeightStyles = getSheetHeightStyles({
    snapPointsMode,
    snapPoints,
    isWebApp,
    interfaceNavHeight: INTERFACE_NAV_HEIGHT,
    mdMaxHeight: (rest.$md as { '$platform-web'?: { maxHeight?: string | number } } | undefined)?.['$platform-web']
      ?.maxHeight,
  }) as FlexCompatProps

  if (!mounted) {
    return null
  }

  const state = isOpen ? 'open' : 'closed'

  // Chrome nodes render as plain divs styled through the Flex compat emission
  // (the legacy chrome was Tamagui Flex): Radix's Content props (data-state,
  // dismissable-layer handlers) land on its own element, and the data-sheet-*
  // markers sit outside the compat prop contract.
  const overlayEmission = flexCompatEmission({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    // Scoped to the sheet's effective z, not the global backdrop layer: a nested sheet's
    // scrim must paint ABOVE its host frame (>= host z + 1); the frame wins over the
    // scrim at equal z through DOM order.
    zIndex: effectiveZIndex,
    backgroundColor: '$scrim',
    // Some iOS Safari versions only forward a synthesized click from a touch tap to elements
    // that resolve to a non-default cursor; without this, a scrim tap could fail to reach the
    // portal container's delegated dismiss listener on those versions.
    cursor: 'pointer',
    '$platform-web': FIXED_FULL_SCREEN,
  })
  const frameEmission = flexCompatEmission({
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: effectiveZIndex,
    backgroundColor: '$surface1',
    borderBottomWidth: '$none',
    borderColor: '$surface3',
    borderTopLeftRadius: '$rounded16',
    borderTopRightRadius: '$rounded16',
    borderWidth: '$spacing1',
    px: '$spacing8',
    ...sheetOverrideStyles,
    ...sheetHeightStyles,
    style: undefined,
    '$platform-web': framePlatformWeb,
  })
  const handleEmission = flexCompatEmission({
    justifyContent: 'center',
    alignItems: 'center',
    m: 0,
    pb: '$spacing16',
    pt: '$spacing8',
    width: '100%',
    backgroundColor: '$transparent',
    cursor: 'grab',
    '$platform-web': { touchAction: 'none' },
  })
  const handleBarEmission = flexCompatEmission({
    backgroundColor: '$neutral3',
    height: '$spacing4',
    width: '$spacing32',
    borderRadius: '$roundedFull',
  })
  const contentEmission = flexCompatEmission({
    flex: 1,
    gap,
    // On the scroller so a consumer frame pb adds to it. Declared in apps/web/src/global.css; keep the name in sync.
    pb: 'var(--mweb-bottom-inset, 0px)',
    '$platform-web': { overflow: 'auto' },
    ...sheetHeightStyles,
  })

  return (
    /* Non-modal + forceMount replicate the legacy Tamagui Sheet contract: children stay
       mounted (hidden off-screen) while closed, keeping their DOM and React state. Radix's
       modal mode is incompatible with that — it aria-hides the rest of the app and disables
       body pointer events for as long as the content is *mounted*, not just while open.
       Scroll-lock is handled by useDisableBodyScroll above; Tamagui Sheet had no focus
       trap, so non-modal matches the previous focus behavior too. */
    <DialogPrimitive.Root modal={false} open={isOpen} onOpenChange={handleClose}>
      <DialogPrimitive.Portal forceMount>
        <div
          className={cn('mc-sheet-overlay', overlayEmission.className)}
          style={overlayEmission.style}
          data-state={state}
          data-testid={WEB_BOTTOM_SHEET_OVERLAY_TEST_ID}
          onClick={handleOverlayPress}
        />
        <DialogPrimitive.Content
          {...domProps(strippedRest)}
          ref={setFrameNode}
          forceMount
          aria-describedby={undefined}
          className={cn('mc-sheet-frame', frameEmission.className)}
          style={mergeCompatStyle(frameEmission.style, frameStyle)}
          data-testid={strippedRest.testID}
          onOpenAutoFocus={preventAutoFocus}
          onEscapeKeyDown={preventRadixEscape}
          onPointerDownOutside={preventOutsideDismiss}
          onFocusOutside={preventOutsideDismiss}
        >
          <DialogPrimitive.Title style={VISUALLY_HIDDEN_STYLE} />
          {!hideHandlebar && (
            <div data-sheet-handle className={handleEmission.className} style={handleEmission.style}>
              <div className={handleBarEmission.className} style={handleBarEmission.style} />
            </div>
          )}
          <div
            data-sheet-content
            className={contentEmission.className}
            style={contentEmission.style}
            onClick={stopPropagation}
            onMouseDown={stopPropagation}
            onMouseUp={stopPropagation}
          >
            {/* Self-provide the depth context so floating compat descendants (tooltips, popovers)
                auto-stack above the sheet even when WebBottomSheet is used standalone. */}
            <EffectiveOverlayZIndexContext.Provider value={effectiveZIndex}>
              {children}
            </EffectiveOverlayZIndexContext.Provider>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
