/**
 * Web-only, drop-in replacement for the legacy `ui/src` Tooltip
 * (`packages/ui/src/components/tooltip/Tooltip.web.tsx`), rendering on Base
 * UI's tooltip — the same portal + positioner + popup engine as the popover
 * compat (INFRA-3021).
 *
 * Contract highlights (pinned by `packages/tailwind/src/parity/tooltip`):
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
import { domProps } from '../compat/dom'
import { flexCompatClassName } from '../flex-compat/compile'
import { mapOffsetToAnchorPosition, mapPlacementToAnchorPosition } from '../popover-compat/position'
import { EffectiveOverlayZIndexContext, OVERLAY_Z_INDEXES, useStackingLayerAbove } from '../popover-compat/z-index'
import {
  mapTooltipDelay,
  TOOLTIP_DEFAULT_DELAY,
  TOOLTIP_DEFAULT_OFFSET,
  TOOLTIP_DEFAULT_REST_MS,
  tooltipArrowCompatClassName,
  tooltipArrowInnerCompatClassName,
  tooltipContentCompatClassName,
} from './compile'
import type {
  PopoverCompatOffset,
  PopoverCompatPlacement,
  TooltipArrowCompatProps,
  TooltipCompatProps,
  TooltipCompatTriggerProps,
  TooltipContentCompatProps,
} from './props'

export interface TooltipCompatConfigContextValue {
  placement?: PopoverCompatPlacement
  offset?: PopoverCompatOffset
  allowFlip?: boolean | Record<string, unknown>
  strategy?: 'absolute' | 'fixed'
  openDelayMs: number
  closeDelayMs: number
}

const DEFAULT_CONFIG: TooltipCompatConfigContextValue = {
  offset: TOOLTIP_DEFAULT_OFFSET,
  ...mapTooltipDelay({ delay: TOOLTIP_DEFAULT_DELAY, restMs: TOOLTIP_DEFAULT_REST_MS }),
}

export const TooltipCompatConfigContext = React.createContext<TooltipCompatConfigContextValue>(DEFAULT_CONFIG)

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
  const handleOpenChange = React.useMemo(() => {
    if (onOpenChange === undefined) {
      return undefined
    }
    return (next: boolean): void => onOpenChange(next)
  }, [onOpenChange])
  const config = React.useMemo(
    () => ({ placement, offset, allowFlip, strategy, ...mapTooltipDelay({ delay, restMs }) }),
    [placement, offset, allowFlip, strategy, delay, restMs],
  )
  return (
    <TooltipPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <TooltipCompatConfigContext.Provider value={config}>{children}</TooltipCompatConfigContext.Provider>
    </TooltipPrimitive.Root>
  )
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
    const forwardedDomProps = domProps(styleAndDomProps)
    const renderAsChild = asChild !== undefined && asChild !== false && React.isValidElement(children)

    let renderElement: React.ReactElement
    if (renderAsChild) {
      const child = children as React.ReactElement<Record<string, unknown>>
      // cloneElement's config REPLACES the child's own props — className and
      // the two callables must be composed by hand, or the child's own
      // onClick/ref silently die (same composition as the CommandItem render
      // branch in shadcn/command.tsx).
      const childClassName = child.props['className']
      const childOnClick = child.props['onClick']
      const childRef = child.props['ref']
      const setNode = (node: HTMLDivElement | null): void => {
        if (typeof childRef === 'function') {
          childRef(node)
        } else if (childRef !== null && typeof childRef === 'object' && 'current' in childRef) {
          ;(childRef as React.MutableRefObject<HTMLDivElement | null>).current = node
        }
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref !== null && typeof ref === 'object') {
          ref.current = node
        }
      }
      const domOnClick = forwardedDomProps['onClick'] as React.MouseEventHandler<HTMLDivElement> | undefined
      const composedClick = (event: React.MouseEvent<HTMLDivElement>): void => {
        if (typeof childOnClick === 'function') {
          childOnClick(event)
        }
        domOnClick?.(event)
      }
      renderElement = React.cloneElement(child, {
        ...forwardedDomProps,
        // Conditional: cloneElement config values override even when
        // `undefined`, which would wipe a child's own data-testid.
        ...(styleAndDomProps.testID !== undefined ? { 'data-testid': styleAndDomProps.testID } : undefined),
        className: cn(
          typeof childClassName === 'string' ? childClassName : undefined,
          flexCompatClassName(styleAndDomProps),
        ),
        onClick: composedClick,
        ref: setNode,
      })
    } else {
      renderElement = (
        // oxlint-disable-next-line react/forbid-elements -- the compat trigger IS the raw DOM boundary (no Tamagui Flex here)
        <div
          ref={ref}
          {...forwardedDomProps}
          className={flexCompatClassName(styleAndDomProps)}
          data-testid={styleAndDomProps.testID}
        />
      )
    }

    if (renderAsChild) {
      // The child IS the render element — omit `children` entirely (not even
      // `undefined`) so Base UI can never apply it as a content wipe.
      return (
        <TooltipPrimitive.Trigger
          data-slot="tooltip-compat-trigger"
          delay={openDelayMs}
          closeDelay={closeDelayMs}
          render={renderElement}
        />
      )
    }
    return (
      <TooltipPrimitive.Trigger
        data-slot="tooltip-compat-trigger"
        delay={openDelayMs}
        closeDelay={closeDelayMs}
        render={renderElement}
      >
        {children}
      </TooltipPrimitive.Trigger>
    )
  },
)

const TooltipCompatContent = React.forwardRef<HTMLDivElement, TooltipContentCompatProps>(
  function TooltipCompatContent(props, ref) {
    const { children, animationDirection, zIndex, ...styleAndInertProps } = props
    const position = React.useContext(TooltipCompatConfigContext)
    const stackingLayerNumber = useStackingLayerAbove(OVERLAY_Z_INDEXES.tooltip)
    const effectiveZIndex = typeof zIndex === 'number' ? zIndex : stackingLayerNumber
    const { side, align } = mapPlacementToAnchorPosition(position.placement)
    const { sideOffset, alignOffset } = mapOffsetToAnchorPosition({ offset: position.offset, align })
    return (
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner
          data-slot="tooltip-compat-positioner"
          className="isolate outline-none"
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          positionMethod={position.strategy}
          collisionAvoidance={position.allowFlip === false ? { side: 'none', align: 'none' } : undefined}
          style={{ zIndex: effectiveZIndex }}
        >
          {/* Legacy Tooltip.Content spreads the event/aria/behavioral surface
              onto the rendered frame; the shared DOM translation forwards it
              onto the Base UI popup the same way as the popover compat
              (testID → data-testid, aria/id/role passthrough, onPress → click). */}
          <TooltipPrimitive.Popup
            ref={ref}
            {...domProps(styleAndInertProps)}
            data-slot="tooltip-compat-popup"
            data-testid={styleAndInertProps.testID}
            className={tooltipContentCompatClassName({ ...styleAndInertProps, animationDirection })}
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
 * The legacy 12px rotated-square arrow. Every repo call site renders it bare;
 * style overrides are accepted for drop-in typing but inert (ledgered).
 *
 * Two elements, like the legacy Tamagui `PopperArrow`: the Base UI Arrow part
 * is an overflow-hidden clip window overlapping the popup border by 1px, and
 * the inner rotated square carries the background/border/shadow with the
 * border on its two outer edges only — so the tip merges with the popup body
 * as one continuous shape (no seam, no floating outlined square). Geometry
 * rationale in `tooltipArrowCompatClassName` (compile.ts).
 */
const TooltipCompatArrow = React.forwardRef<HTMLDivElement, TooltipArrowCompatProps>(
  function TooltipCompatArrow(_props, ref) {
    return (
      <TooltipPrimitive.Arrow ref={ref} data-slot="tooltip-compat-arrow" className={tooltipArrowCompatClassName()}>
        {/* oxlint-disable-next-line react/forbid-elements -- raw DOM inside the compat arrow (no Tamagui Flex here) */}
        <div data-slot="tooltip-compat-arrow-inner" className={tooltipArrowInnerCompatClassName()} />
      </TooltipPrimitive.Arrow>
    )
  },
)

export const TooltipCompat = Object.assign(TooltipCompatRoot, {
  Trigger: TooltipCompatTrigger,
  Content: TooltipCompatContent,
  Arrow: TooltipCompatArrow,
})
