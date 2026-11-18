/**
 * Web-only, drop-in replacement for the legacy
 * `ui/src/components/popover/AdaptiveWebPopoverContent` — a THIN ADAPTER
 * over the shadcn Popover recipe (`../shadcn/popover`), which owns the
 * portal/positioner/popup anatomy and collision avoidance (INFRA-3021).
 * This layer keeps only what the recipe cannot know: the legacy prop→class
 * compilation (`unstyled` popup, byte-exact classes), the Tamagui
 * placement/offset mapping, the overlay z-index bridge, the wired
 * FocusScope/Dismissable mapping, and the web bottom-sheet adaptation leg.
 *
 * Contract highlights (pinned by `packages/tailwind/src/parity/popover`):
 * - accepts the full legacy prop surface (the leaked Tamagui Popover.Content
 *   props via the Flex compat style contract + the adaptive props);
 * - consumes the `EffectiveModalOrSheetZIndexContext` equivalent
 *   (`EffectiveOverlayZIndexContext`), renders one stacking layer above the
 *   host (popover floor 1070), and RE-PROVIDES the bumped value — so a
 *   popover inside a z-1060 modal stacks above it instead of a naive portal
 *   landing at z≈1000 behind it;
 * - on small viewports (or when forced by `isSheet`/`adaptWhen`), displaces
 *   the popover positioner for the mycelium `WebBottomSheet` (INFRA-3329),
 *   mirroring legacy `Popover.Adapt`: same `isSheet ?? (isWebApp &&
 *   (adaptWhen ?? media.sm))` condition, same z-index bridging (a raw
 *   `stackingLayerNumber` handed to the sheet, which re-provides it to
 *   descendants itself), and — critically — the same `isWebApp` gate, so the
 *   extension (which resolves `.web.tsx` too) never adapts into a sheet.
 */
import { FocusScope as RadixFocusScope } from '@radix-ui/react-focus-scope'
import { isWebApp } from '@universe/environment'
import * as React from 'react'
import { mergeCompatStyle } from '../compat/compose'
import { domProps, useOnLayout } from '../compat/dom'
import { PopoverContent } from '../shadcn/popover'
import { useMedia } from '../theme-hooks-compat'
import { WebBottomSheet } from '../web-bottom-sheet-compat'
import { adaptiveWebPopoverContentCompatEmission } from './compile'
import type { PopoverCompatDismissInterceptors } from './PopoverCompat'
import { PopoverCompatInternalsContext, PopoverCompatPositionContext } from './PopoverCompat'
import { OVERLAY_PORTAL_CONTAINER_ATTRIBUTE } from './portal-container'
import { mapOffsetToAnchorPosition, mapPlacementToAnchorPosition } from './position'
import type { AdaptiveWebPopoverContentCompatProps } from './props'
import { EffectiveOverlayZIndexContext, OVERLAY_Z_INDEXES, useStackingLayerAbove } from './z-index'

/**
 * When sheet-adapted, the Base UI popup never mounts — the sheet displaces it
 * entirely (legacy `Popover.Adapt`). But the Base UI root's dismissal keeps
 * hit-testing presses against that never-mounted popup, so EVERY press —
 * including ones inside the portaled sheet (its search input, its rows) —
 * reads as an outside press and closes the popover (SWAP-3309, mobile web).
 * The sheet owns dismissal in this mode (scrim press, drag-down, its own
 * Escape stack via useDismissLayer), so the root's requests are all
 * spurious: swallow them. This also matches the sheet-branch contract below —
 * the caller's Popover.Content-specific dismiss interceptors never apply here.
 */
const swallowDismissRequest = (event: { preventDefault: () => void }): void => {
  event.preventDefault()
}
const SHEET_ADAPTED_DISMISS_INTERCEPTORS: PopoverCompatDismissInterceptors = {
  onEscapeKeyDown: swallowDismissRequest,
  onPointerDownOutside: swallowDismissRequest,
  onFocusOutside: swallowDismissRequest,
  onInteractOutside: swallowDismissRequest,
}

export const AdaptiveWebPopoverContentCompat = React.forwardRef<HTMLDivElement, AdaptiveWebPopoverContentCompatProps>(
  function AdaptiveWebPopoverContentCompat(props, ref) {
    const {
      children,
      isOpen,
      isSheet,
      adaptWhen,
      webBottomSheetProps,
      placement,
      // The legacy FocusScope / Dismissable surface (wired, see props.ts).
      onOpenAutoFocus,
      onCloseAutoFocus,
      disableFocusScope,
      onEscapeKeyDown,
      onPointerDownOutside,
      onFocusOutside,
      onInteractOutside,
      onFocusCapture,
      onBlurCapture,
      ...styleAndInertProps
    } = props

    const position = React.useContext(PopoverCompatPositionContext)
    const internals = React.useContext(PopoverCompatInternalsContext)
    const stackingLayerNumber = useStackingLayerAbove(OVERLAY_Z_INDEXES.popover)

    // A focus-trapping host modal marks its content element so the popup portals inside the
    // trap's subtree and can hold focus (SWAP-3309, see portal-container.ts). `fixed` positioning
    // escapes the host content's overflow clipping; floating-ui autoUpdate re-anchors on scroll.
    // The trigger element is context STATE, so its mount re-renders this consumer with the
    // element set — the structural guarantee that even an uncontrolled first open (`defaultOpen`,
    // hover: Base UI owns that state, nothing above the popup re-renders) resolves the host
    // before the popup can open (a first frame portaled to body would re-race the dialog's
    // focus trap).
    const triggerElement = internals?.triggerElement ?? null
    const hostPortalContainer = React.useMemo(
      () => triggerElement?.closest<HTMLElement>(`[${OVERLAY_PORTAL_CONTAINER_ATTRIBUTE}]`) ?? undefined,
      [triggerElement],
    )

    // Legacy `useSheetOnWeb = adaptWhen ?? media.sm` gated by `isWebApp` — the
    // extension resolves this same `.web.tsx` file but must never adapt into a
    // sheet (AdaptiveWebPopoverContent.tsx's `Popover.Adapt when` condition).
    const media = useMedia()
    const isSheetAdapted = isSheet ?? (isWebApp && (adaptWhen ?? media.sm))

    // Register the Dismissable interceptors with the compat root (assigned
    // every render so the latest handlers run; cleared on unmount). No-op
    // outside a compat root — nothing to intercept, matching a standalone
    // render. Sheet mode swallows every root close request instead — see
    // SHEET_ADAPTED_DISMISS_INTERCEPTORS.
    const dismissInterceptorsRef = internals?.dismissInterceptorsRef ?? null
    React.useEffect(() => {
      if (dismissInterceptorsRef === null) {
        return undefined
      }
      dismissInterceptorsRef.current = isSheetAdapted
        ? SHEET_ADAPTED_DISMISS_INTERCEPTORS
        : { onEscapeKeyDown, onPointerDownOutside, onFocusOutside, onInteractOutside }
      return (): void => {
        dismissInterceptorsRef.current = null
      }
    })

    // Legacy FocusScope mapping (see props.ts): with neither callback the
    // compat keeps the legacy no-focus-move default; a provided callback runs
    // with a cancelable event and preventDefault keeps focus where it is.
    const initialFocus =
      disableFocusScope === true || onOpenAutoFocus === undefined
        ? false
        : (): boolean => {
            const event = new Event('focusScope.autoFocusOnMount', { cancelable: true })
            onOpenAutoFocus(event)
            return !event.defaultPrevented
          }
    const finalFocus =
      disableFocusScope === true || onCloseAutoFocus === undefined || onCloseAutoFocus === false
        ? false
        : (): boolean => {
            const event = new Event('focusScope.autoFocusOnUnmount', { cancelable: true })
            onCloseAutoFocus(event)
            return !event.defaultPrevented
          }

    const effectivePlacement = placement ?? position.placement
    const { side, align } = mapPlacementToAnchorPosition(effectivePlacement)
    const { sideOffset, alignOffset } = mapOffsetToAnchorPosition({ offset: position.offset, align })

    // Legacy Popover.Content spreads the event/aria/behavioral surface onto
    // the rendered frame; the shared DOM translation forwards it onto the
    // Base UI popup the same way (onPress → click, aria passthrough, …).
    const layoutRef = useOnLayout(styleAndInertProps.onLayout)
    const setRef = React.useCallback(
      (node: HTMLDivElement | null): void => {
        layoutRef(node)
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref !== null) {
          ref.current = node
        }
      },
      [layoutRef, ref],
    )

    // The sheet displaces the popover positioner entirely (legacy
    // `Popover.Adapt`): only `webBottomSheetProps` reaches the sheet — the
    // popup's own style/inert props (backgroundColor, padding, aria, focus
    // scope, dismiss interceptors, …) are Popover.Content-specific and never
    // applied here, matching AdaptiveWebPopoverContent.tsx. `zIndex` defaults
    // to the same stacking layer the positioner would have used, but a caller
    // override in `webBottomSheetProps` wins (legacy prop order: `zIndex={…}
    // {...webBottomSheetProps}`).
    if (isSheetAdapted) {
      return (
        <WebBottomSheet
          isOpen={isOpen}
          zIndex={stackingLayerNumber}
          // On a small screen the sheet replaces the popup, so it takes the popup's name.
          title={styleAndInertProps['aria-label'] ?? ''}
          aria-labelledby={styleAndInertProps['aria-labelledby']}
          {...webBottomSheetProps}
        >
          {children}
        </WebBottomSheet>
      )
    }

    // Only computed for the popover leg above — the sheet branch above never
    // reads it (review feedback, PR #39586).
    const emission = adaptiveWebPopoverContentCompatEmission({
      ...styleAndInertProps,
      placement: effectivePlacement,
    })

    return (
      <PopoverContent
        unstyled
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        collisionAvoidance={position.allowFlip === false ? { side: 'none', align: 'none' } : undefined}
        portalContainer={hostPortalContainer}
        positionerProps={{
          'data-slot': 'adaptive-popover-positioner',
          className: 'isolate outline-none',
          positionMethod: hostPortalContainer ? 'fixed' : position.strategy,
          // Escapes a host modal's body-level `pointer-events: none` lock (inherited by this
          // portaled positioner). Gated on `isOpen` so a closing popup's exit transition
          // doesn't keep swallowing clicks; `undefined`, not `'none'`, leaves Base UI's own
          // inert default in place while closed.
          style: { zIndex: stackingLayerNumber, pointerEvents: isOpen ? 'auto' : undefined },
        }}
        ref={setRef}
        {...domProps(styleAndInertProps)}
        data-slot="adaptive-popover-popup"
        data-testid={styleAndInertProps.testID}
        style={mergeCompatStyle(emission.style, styleAndInertProps.style)}
        onFocusCapture={onFocusCapture}
        onBlurCapture={onBlurCapture}
        // Legacy popovers neither steal focus on open nor restore it on
        // close by DEFAULT (Tamagui trapFocus defaults off) — the wired
        // onOpenAutoFocus/onCloseAutoFocus callbacks opt into Base UI's
        // focus moves per call site (see props.ts).
        initialFocus={initialFocus}
        finalFocus={finalFocus}
        className={emission.className}
      >
        {/* Fallback for Radix dialogs that don't mark a portal container: mounting a FocusScope
            pauses the dialog's trap while the popup is open. Works only when both sides resolve
            one @radix-ui/react-focus-scope instance (pin to react-dialog's version), which
            bundler chunking can break, hence the containment path above. display:contents keeps
            the div out of the popup's flex layout; both autofocus events are prevented so focus
            moves stay owned by the initialFocus/finalFocus mapping. `disableFocusScope` keeps
            the legacy bypass: no scope, no pause. */}
        {disableFocusScope === true ? (
          <EffectiveOverlayZIndexContext.Provider value={stackingLayerNumber}>
            {children}
          </EffectiveOverlayZIndexContext.Provider>
        ) : (
          <RadixFocusScope
            style={DISPLAY_CONTENTS}
            onMountAutoFocus={preventAutoFocus}
            onUnmountAutoFocus={preventAutoFocus}
          >
            <EffectiveOverlayZIndexContext.Provider value={stackingLayerNumber}>
              {children}
            </EffectiveOverlayZIndexContext.Provider>
          </RadixFocusScope>
        )}
      </PopoverContent>
    )
  },
)

const DISPLAY_CONTENTS: React.CSSProperties = { display: 'contents' }

function preventAutoFocus(event: Event): void {
  event.preventDefault()
}
