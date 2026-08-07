/**
 * Web-only, drop-in replacement for the legacy
 * `ui/src/components/popover/AdaptiveWebPopoverContent` — a THIN ADAPTER
 * over the shadcn Popover recipe (`../shadcn/popover`), which owns the
 * portal/positioner/popup anatomy and collision avoidance (INFRA-3021).
 * This layer keeps only what the recipe cannot know: the legacy prop→class
 * compilation (`unstyled` popup, byte-exact classes), the Tamagui
 * placement/offset mapping, the overlay z-index bridge, the wired
 * FocusScope/Dismissable mapping, and the gated sheet leg.
 *
 * Contract highlights (pinned by `packages/tailwind/src/parity/popover`):
 * - accepts the full legacy prop surface (the leaked Tamagui Popover.Content
 *   props via the Flex compat style contract + the adaptive props);
 * - consumes the `EffectiveModalOrSheetZIndexContext` equivalent
 *   (`EffectiveOverlayZIndexContext`), renders one stacking layer above the
 *   host (popover floor 1070), and RE-PROVIDES the bumped value — so a
 *   popover inside a z-1060 modal stacks above it instead of a naive portal
 *   landing at z≈1000 behind it;
 * - `isSheet` / `adaptWhen` / `webBottomSheetProps` are accepted with exact
 *   types but the sheet-adaptation BEHAVIOR is GATED on the Sheet/Dialog
 *   migration track: the content renders as a popover regardless (see the
 *   exclusions ledger).
 */
import * as React from 'react'
import { domProps, useOnLayout } from '../compat/dom'
import { PopoverContent } from '../shadcn/popover'
import { adaptiveWebPopoverContentCompatClassName } from './compile'
import { PopoverCompatDismissInterceptContext, PopoverCompatPositionContext } from './PopoverCompat'
import { mapOffsetToAnchorPosition, mapPlacementToAnchorPosition } from './position'
import type { AdaptiveWebPopoverContentCompatProps } from './props'
import { EffectiveOverlayZIndexContext, OVERLAY_Z_INDEXES, useStackingLayerAbove } from './z-index'

export const AdaptiveWebPopoverContentCompat = React.forwardRef<HTMLDivElement, AdaptiveWebPopoverContentCompatProps>(
  function AdaptiveWebPopoverContentCompat(props, ref) {
    const {
      children,
      // Sheet-leg props: accepted (exact legacy typing) but GATED — popover renders regardless.
      isOpen: _isOpen,
      isSheet: _isSheet,
      adaptWhen: _adaptWhen,
      webBottomSheetProps: _webBottomSheetProps,
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
    const stackingLayerNumber = useStackingLayerAbove(OVERLAY_Z_INDEXES.popover)

    // Register the Dismissable interceptors with the compat root (assigned
    // every render so the latest handlers run; cleared on unmount).
    const dismissInterceptorsRef = React.useContext(PopoverCompatDismissInterceptContext)
    React.useEffect(() => {
      if (dismissInterceptorsRef === null) {
        return undefined
      }
      dismissInterceptorsRef.current = { onEscapeKeyDown, onPointerDownOutside, onFocusOutside, onInteractOutside }
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

    return (
      <PopoverContent
        unstyled
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        collisionAvoidance={position.allowFlip === false ? { side: 'none', align: 'none' } : undefined}
        positionerProps={{
          'data-slot': 'adaptive-popover-positioner',
          className: 'isolate outline-none',
          positionMethod: position.strategy,
          style: { zIndex: stackingLayerNumber },
        }}
        ref={setRef}
        {...domProps(styleAndInertProps)}
        data-slot="adaptive-popover-popup"
        data-testid={styleAndInertProps.testID}
        style={styleAndInertProps.style}
        onFocusCapture={onFocusCapture}
        onBlurCapture={onBlurCapture}
        // Legacy popovers neither steal focus on open nor restore it on
        // close by DEFAULT (Tamagui trapFocus defaults off) — the wired
        // onOpenAutoFocus/onCloseAutoFocus callbacks opt into Base UI's
        // focus moves per call site (see props.ts).
        initialFocus={initialFocus}
        finalFocus={finalFocus}
        className={adaptiveWebPopoverContentCompatClassName({
          ...styleAndInertProps,
          placement: effectivePlacement,
        })}
      >
        <EffectiveOverlayZIndexContext.Provider value={stackingLayerNumber}>
          {children}
        </EffectiveOverlayZIndexContext.Provider>
      </PopoverContent>
    )
  },
)
