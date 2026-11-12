/**
 * Web-only, drop-in replacement for the legacy `ui/src` Tooltip, rendering on
 * Base UI's tooltip — the same portal + positioner + popup engine as the
 * popover compat (INFRA-3021).
 *
 * Contract highlights (pinned by `TooltipCompat.web.test.tsx`):
 * - the full legacy prop surface on root/trigger/content/arrow (the popper
 *   vocabulary + the leaked Tamagui stack surfaces via the Flex compat
 *   contract);
 * - the legacy ui/src styled defaults baked in: `offset {mainAxis: 16}`,
 *   `delay {close: 500, open: 0}`, `restMs 200`, and the ContentInner frame;
 * - fully controlled when `open` is set, uncontrolled hover/focus otherwise —
 *   exactly like the legacy `TooltipBase`;
 * - consumes the overlay z-index bridge (`EffectiveOverlayZIndexContext`),
 *   renders one stacking layer above the host (tooltip floor 1080), honors
 *   the legacy `zIndex` escape hatch, and RE-PROVIDES the layer — so a
 *   tooltip inside a z-1060 modal stacks above it.
 *
 * The Radix-based `components/tooltip.tsx` (mission-control's, via the
 * mycelium barrel) is deliberately untouched; this compat coexists with it
 * exactly like popover-compat/menu-compat coexist with the Radix scaffolding.
 */
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import * as React from 'react'
import { cn } from '../cn'
import { mergeCompatStyle } from '../compat/compose'
import { domProps } from '../compat/dom'
import { domTestId } from '../compat/dom-test-id'
import { lookupToken, resolveColorOrWarn } from '../compat/tokens'
import { flexCompatEmission, flexCompatOverridesEmission } from '../flex-compat/compile'
import { mapOffsetToAnchorPosition, mapPlacementToAnchorPosition } from '../popover-compat/position'
import { EffectiveOverlayZIndexContext, OVERLAY_Z_INDEXES, useStackingLayerAbove } from '../popover-compat/z-index'
import { type UseSporeColorsReturn, useSporeColors } from '../theme-hooks-compat/useSporeColors'
import {
  mapTooltipDelay,
  TOOLTIP_COMPAT_POPUP_DATA_SLOT,
  TOOLTIP_DEFAULT_CONFIG,
  TOOLTIP_DEFAULT_DELAY,
  TOOLTIP_DEFAULT_OFFSET,
  TOOLTIP_DEFAULT_REST_MS,
  tooltipArrowCompatClassName,
  tooltipArrowInnerCompatClassName,
  tooltipContentCompatEmission,
} from './compile'
import { useControllableOpen } from './hooks/useControllableOpen'
import { useTooltipTouchSession } from './hooks/useTooltipTouchSession'
import type {
  TooltipArrowCompatProps,
  TooltipCompatConfigContextValue,
  TooltipCompatProps,
  TooltipCompatTriggerProps,
  TooltipContentCompatProps,
} from './props'

export const TooltipCompatConfigContext = React.createContext<TooltipCompatConfigContextValue>(TOOLTIP_DEFAULT_CONFIG)

/**
 * The open/requestOpenChange pair lives on its own context, separate from
 * the static positioning config above: only the Trigger reads it, and it
 * changes on every open/close, so bundling it into TooltipCompatConfigContext
 * would re-render Content (and everything under it) on every hover/tap.
 */
interface TooltipCompatOpenStateContextValue {
  isOpen: boolean
  requestOpenChange: (nextOpen: boolean) => void
}

const TooltipCompatOpenStateContext = React.createContext<TooltipCompatOpenStateContextValue>({
  isOpen: false,
  requestOpenChange: () => {},
})

function TooltipCompatRoot(props: TooltipCompatProps): React.JSX.Element {
  const {
    children,
    open,
    onOpenChange,
    placement,
    offset = TOOLTIP_DEFAULT_OFFSET,
    allowFlip,
    strategy,
    delay = TOOLTIP_DEFAULT_DELAY,
    restMs = TOOLTIP_DEFAULT_REST_MS,
  } = props
  // Always driving Base UI's Root as controlled gives the trigger's touch
  // affordance a `requestOpenChange` it can call to force the tooltip open
  // on tap — Base UI's own hover is hard-coded mouse-only.
  const [currentOpen, requestOpenChange] = useControllableOpen({ open, onOpenChange })
  const config = React.useMemo(
    () => ({ placement, offset, allowFlip, strategy, ...mapTooltipDelay({ delay, restMs }) }),
    [placement, offset, allowFlip, strategy, delay, restMs],
  )
  const openState = React.useMemo(() => ({ isOpen: currentOpen, requestOpenChange }), [currentOpen, requestOpenChange])
  return (
    <TooltipPrimitive.Root open={currentOpen} onOpenChange={requestOpenChange}>
      <TooltipCompatConfigContext.Provider value={config}>
        <TooltipCompatOpenStateContext.Provider value={openState}>{children}</TooltipCompatOpenStateContext.Provider>
      </TooltipCompatConfigContext.Provider>
    </TooltipPrimitive.Root>
  )
}

type OptionalHandler<E> = ((event: E) => void) | undefined

/** Calls every defined handler in order — chains a child's own handler, a caller-forwarded DOM prop, and the compat's own wiring without any of them clobbering each other. */
function composeHandlers<E>(...handlers: Array<OptionalHandler<E>>): (event: E) => void {
  return (event) => {
    for (const handler of handlers) {
      handler?.(event)
    }
  }
}

/** Composes the forwarded trigger ref, an asChild caller's own ref (if any), and the internal node ref the touch session needs for its tap-away containment check. */
function composeTriggerRef({
  ref,
  childRef,
  triggerNodeRef,
}: {
  ref: React.Ref<HTMLDivElement>
  childRef: React.Ref<HTMLDivElement> | undefined
  triggerNodeRef: React.MutableRefObject<HTMLDivElement | null>
}): (node: HTMLDivElement | null) => void {
  return (node) => {
    triggerNodeRef.current = node
    if (typeof childRef === 'function') {
      childRef(node)
    } else if (childRef !== null && childRef !== undefined && typeof childRef === 'object' && 'current' in childRef) {
      ;(childRef as React.MutableRefObject<HTMLDivElement | null>).current = node
    }
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref !== null && typeof ref === 'object') {
      ref.current = node
    }
  }
}

/**
 * Renders a plain `div` wrapper like the Tamagui trigger stack (not a native
 * button) so arbitrary trigger content keeps its own semantics; with
 * `asChild`, the child element itself becomes the trigger, like Tamagui.
 * Trigger style props compile through the Flex compat contract on BOTH
 * branches, and the non-style DOM surface (testID → data-testid, aria/id/role
 * passthrough, onPress → click, …) forwards through the shared `domProps`
 * seam like the popover compat — the legacy Tamagui `asChild` forwards the
 * computed styles (and press handler) to the child, so the compat
 * clone-merges them: the child's own className/onClick/ref are preserved and
 * composed with the compiled classes, the forwarded DOM props, and the
 * forwarded ref.
 */
const TooltipCompatTrigger = React.forwardRef<HTMLDivElement, TooltipCompatTriggerProps>(
  function TooltipCompatTrigger(props, ref) {
    const { children, asChild, ...styleAndDomProps } = props
    const { openDelayMs, closeDelayMs } = React.useContext(TooltipCompatConfigContext)
    const { isOpen, requestOpenChange } = React.useContext(TooltipCompatOpenStateContext)
    const forwardedDomProps = domProps(styleAndDomProps)
    const renderAsChild = asChild !== undefined && asChild !== false && React.isValidElement(children)

    // Touch affordance + tap-away lifecycle — see useTooltipTouchSession.
    const triggerNodeRef = React.useRef<HTMLDivElement | null>(null)
    const { handleTriggerPointerDown, handleTriggerClick } = useTooltipTouchSession({
      isOpen,
      requestOpenChange,
      triggerNodeRef,
    })
    const domOnPointerDown = forwardedDomProps['onPointerDown'] as React.PointerEventHandler<HTMLDivElement> | undefined

    let renderElement: React.ReactElement
    if (renderAsChild) {
      const child = children as React.ReactElement<Record<string, unknown>>
      // cloneElement's config REPLACES the child's own props — className and
      // the two callables must be composed by hand, or the child's own
      // onClick/ref silently die (same composition as the CommandItem render
      // branch in shadcn/command.tsx).
      const childClassName = child.props['className']
      const childOnClick = child.props['onClick'] as React.MouseEventHandler<HTMLDivElement> | undefined
      const childOnPointerDown = child.props['onPointerDown'] as React.PointerEventHandler<HTMLDivElement> | undefined
      const childRef = child.props['ref'] as React.Ref<HTMLDivElement> | undefined
      const domOnClick = forwardedDomProps['onClick'] as React.MouseEventHandler<HTMLDivElement> | undefined
      // Frame-defaults-free: the injected string lands in the child's incoming
      // `className`, which merges AFTER the child's own compilation, so a
      // default `flex-col`/`items-stretch` would silently beat the child's
      // explicit `flex-row`/`items-center`. Only caller-specified Trigger
      // style props forward (they legitimately override, like Tamagui asChild).
      const emission = flexCompatOverridesEmission(styleAndDomProps)
      const childStyle = child.props['style'] as React.CSSProperties | undefined
      renderElement = React.cloneElement(child, {
        ...forwardedDomProps,
        ...domTestId(styleAndDomProps.testID),
        // Conditional: a cloneElement config `style` overrides even when
        // `undefined`, which would wipe a child's own style (domTestId's
        // docstring covers the data-testid half).
        ...(emission.style !== undefined || childStyle !== undefined
          ? { style: mergeCompatStyle(emission.style, childStyle) }
          : undefined),
        className: cn(typeof childClassName === 'string' ? childClassName : undefined, emission.className),
        onClick: composeHandlers(childOnClick, domOnClick, handleTriggerClick),
        onPointerDown: composeHandlers(childOnPointerDown, domOnPointerDown, handleTriggerPointerDown),
        ref: composeTriggerRef({ ref, childRef, triggerNodeRef }),
      })
    } else {
      const emission = flexCompatEmission(styleAndDomProps)
      renderElement = (
        // oxlint-disable-next-line react/forbid-elements, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- the compat trigger IS the raw DOM boundary (no Tamagui Flex here); the click is the touch tap-to-open, keyboard opens on focus via Base UI
        <div
          ref={composeTriggerRef({ ref, childRef: undefined, triggerNodeRef })}
          {...forwardedDomProps}
          onPointerDown={composeHandlers(domOnPointerDown, handleTriggerPointerDown)}
          onClick={composeHandlers(
            forwardedDomProps['onClick'] as React.MouseEventHandler<HTMLDivElement> | undefined,
            handleTriggerClick,
          )}
          className={emission.className}
          // The caller's `style` prop merges over the computed inline values
          // (the dom.tsx merge-order promise).
          style={mergeCompatStyle(emission.style, styleAndDomProps.style)}
          data-testid={styleAndDomProps.testID}
        />
      )
    }

    const sharedTriggerProps = {
      'data-slot': 'tooltip-compat-trigger' as const,
      delay: openDelayMs,
      closeDelay: closeDelayMs,
      // Base UI defaults this to true; the legacy hover-driven tooltip never closed on click.
      closeOnClick: false,
      render: renderElement,
    }
    if (renderAsChild) {
      // The child IS the render element — omit `children` entirely (not even
      // `undefined`) so Base UI can never apply it as a content wipe.
      return <TooltipPrimitive.Trigger {...sharedTriggerProps} />
    }
    return <TooltipPrimitive.Trigger {...sharedTriggerProps}>{children}</TooltipPrimitive.Trigger>
  },
)

// Base UI mounts a nested portal inside its parent overlay's portal, so inside a popover hosted by a
// modal this <div> would be a new flex item in the modal's gapped column and resize it on every open.
const PORTAL_WRAPPER_STYLE: React.CSSProperties = { display: 'contents' }

const TooltipCompatContent = React.forwardRef<HTMLDivElement, TooltipContentCompatProps>(
  function TooltipCompatContent(props, ref) {
    const { children, animationDirection, zIndex, ...styleAndInertProps } = props
    const position = React.useContext(TooltipCompatConfigContext)
    const stackingLayerNumber = useStackingLayerAbove(OVERLAY_Z_INDEXES.tooltip)
    const effectiveZIndex = typeof zIndex === 'number' ? zIndex : stackingLayerNumber
    const { side, align } = mapPlacementToAnchorPosition(position.placement)
    const { sideOffset, alignOffset } = mapOffsetToAnchorPosition({ offset: position.offset, align })
    const contentEmission = tooltipContentCompatEmission({ ...styleAndInertProps, animationDirection })
    return (
      <TooltipPrimitive.Portal style={PORTAL_WRAPPER_STYLE}>
        <TooltipPrimitive.Positioner
          data-slot="tooltip-compat-positioner"
          className="isolate outline-none"
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          positionMethod={position.strategy}
          collisionAvoidance={position.allowFlip === false ? { side: 'none', align: 'none' } : undefined}
          // Base UI inerts the positioner only while CLOSED, so an open one swallows clicks
          // beneath it. A caller re-enables per tooltip via pointerEvents on Content.
          style={{ pointerEvents: 'none', zIndex: effectiveZIndex }}
        >
          {/* Legacy Tooltip.Content spreads the event/aria/behavioral surface
              onto the rendered frame; the shared DOM translation forwards it
              onto the Base UI popup the same way as the popover compat
              (testID → data-testid, aria/id/role passthrough, onPress → click). */}
          <TooltipPrimitive.Popup
            ref={ref}
            {...domProps(styleAndInertProps)}
            data-slot={TOOLTIP_COMPAT_POPUP_DATA_SLOT}
            data-testid={styleAndInertProps.testID}
            className={contentEmission.className}
            style={contentEmission.style}
          >
            <EffectiveOverlayZIndexContext.Provider value={effectiveZIndex}>
              {children}
            </EffectiveOverlayZIndexContext.Provider>
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    )
  },
)

/**
 * The legacy 12px rotated-square arrow. `backgroundColor`/`borderColor` are
 * honored (Coachmark paints its contrast bubble's arrow with them); every other
 * style override is accepted for drop-in typing but inert.
 *
 * Two elements, like the legacy Tamagui `PopperArrow`: the Base UI Arrow part
 * is an overflow-hidden clip window overlapping the popup border by 1px, and
 * the inner rotated square carries the background/border/shadow with the
 * border on its two outer edges only — so the tip merges with the popup body
 * as one continuous shape (no seam, no floating outlined square). Geometry
 * rationale in `tooltipArrowCompatClassName` (compile.ts).
 */
const TooltipCompatArrow = React.forwardRef<HTMLDivElement, TooltipArrowCompatProps>(function TooltipCompatArrow(
  { backgroundColor, borderColor },
  ref,
) {
  const colors = useSporeColors()
  const innerStyle: React.CSSProperties = {
    backgroundColor: arrowColor(backgroundColor, colors),
    borderColor: arrowColor(borderColor, colors),
  }
  return (
    <TooltipPrimitive.Arrow ref={ref} data-slot="tooltip-compat-arrow" className={tooltipArrowCompatClassName()}>
      {/* oxlint-disable-next-line react/forbid-elements -- raw DOM inside the compat arrow (no Tamagui Flex here) */}
      <div data-slot="tooltip-compat-arrow-inner" className={tooltipArrowInnerCompatClassName()} style={innerStyle} />
    </TooltipPrimitive.Arrow>
  )
})

export const TooltipCompat = Object.assign(TooltipCompatRoot, {
  Trigger: TooltipCompatTrigger,
  Content: TooltipCompatContent,
  Arrow: TooltipCompatArrow,
})

/** A Spore token resolves through the active theme; a raw CSS color passes through. */
function arrowColor(
  value: TooltipArrowCompatProps['backgroundColor'],
  colors: UseSporeColorsReturn,
): string | undefined {
  const resolved = value === undefined ? undefined : resolveColorOrWarn(value)
  if (resolved === undefined) {
    return undefined
  }
  return lookupToken(colors, resolved)?.val ?? resolved
}
