import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import { useIsDarkMode, useSporeColors } from '@universe/mycelium'
import {
  cloneElement,
  createContext,
  type CSSProperties,
  forwardRef,
  isValidElement,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
  type Ref,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
// From the shared module, not the AdaptiveWebModal barrel: the barrel pulls ui/src Flex, which
// would put tamagui back in this file's graph.
import {
  DualZIndexProvider,
  EffectiveModalOrSheetZIndexContext,
  stackingLayerAbove,
} from 'ui/src/components/modal/AdaptiveWebModalShared'
import {
  mapOffsetToAnchorPosition,
  mapPlacementToAnchorPosition,
  mapTooltipDelay,
  TOOLTIP_DEFAULT_DELAY,
  TOOLTIP_DEFAULT_OFFSET,
  TOOLTIP_DEFAULT_REST_MS,
  TOOLTIP_POPUP_DATA_SLOT,
} from 'ui/src/components/tooltip/shared'
import {
  arrowInnerStyle,
  arrowSideOf,
  arrowWindowStyle,
  contentFrameStyle,
  FRAME_BASE_STYLE,
  motionStyle,
  resolveTooltipColor,
  resolveTooltipStyleProps,
} from 'ui/src/components/tooltip/tooltipStyleResolution'
import type {
  TooltipArrowProps,
  TooltipContentProps,
  TooltipOffset,
  TooltipPlacement,
  TooltipProps,
  TooltipTriggerProps,
} from 'ui/src/components/tooltip/types'
import { useTooltipTouchSession } from 'ui/src/components/tooltip/useTooltipTouchSession'
import { zIndexes } from 'ui/src/theme'
import { useComposedRefs } from 'utilities/src/react/composeRefs'
import { useEvent } from 'utilities/src/react/hooks'

export type {
  TooltipAnimationDirection,
  TooltipArrowProps,
  TooltipContentProps,
  TooltipDelay,
  TooltipOffset,
  TooltipPlacement,
  TooltipProps,
  TooltipTriggerProps,
} from 'ui/src/components/tooltip/types'

/**
 * Web leg of the rebuilt Tooltip (INFRA-3318): Base UI's tooltip engine (the same
 * portal + positioner + popup parts as mycelium's tooltip-compat, INFRA-3021) under
 * the legacy `ui/src` export surface, styled exclusively with inline styles resolved
 * through useSporeColors — no Tamagui, no class emission (INFRA-3285 keeps
 * `packages/ui` out of every Tailwind `@source` scan). That rules out both usual
 * div alternatives — `Flex` is Tamagui, and mycelium primitives emit Tailwind
 * classes that would silently not exist here — so the raw inline-styled divs below
 * are deliberate, not an oversight.
 *
 * Legacy behaviors kept: the `TooltipRoot` styled defaults (offset `{mainAxis: 16}`,
 * `delay {close: 500, open: 0}`, `restMs 200`), fully-controlled-when-`open`-is-set
 * semantics, the `ContentInner` frame literals, the ±4px enter/exit fade per
 * `animationDirection`, and the modal/sheet stacking bridge (content renders one
 * layer above `EffectiveModalOrSheetZIndexContext`, floored at `zIndexes.tooltip`,
 * and RE-PROVIDES the bumped layer to its children). The legacy Adapt-scope
 * isolation is obsolete: Base UI portals to the document body, so no parent sheet
 * can capture tooltip content.
 */

interface TooltipConfigContextValue {
  placement?: TooltipPlacement
  offset?: TooltipOffset
  allowFlip?: boolean
  strategy?: 'absolute' | 'fixed'
  openDelayMs: number
  closeDelayMs: number
  /**
   * Routes an open/close request through the root's controlled/uncontrolled handling —
   * the trigger's touch affordance uses it, since Base UI's own trigger hover is
   * hard-coded `mouseOnly` while the legacy floating-ui hover also opened on tap.
   */
  requestOpenChange: (nextOpen: boolean) => void
  /** The root's effective open state — the trigger's touch dismissal keys off it. */
  isOpen: boolean
}

const TooltipConfigContext = createContext<TooltipConfigContextValue>({
  offset: TOOLTIP_DEFAULT_OFFSET,
  ...mapTooltipDelay({ delay: TOOLTIP_DEFAULT_DELAY, restMs: TOOLTIP_DEFAULT_REST_MS }),
  requestOpenChange: () => {},
  isOpen: false,
})

function TooltipRoot(props: TooltipProps): JSX.Element {
  const {
    children,
    open: openProp,
    onOpenChange,
    placement,
    offset = TOOLTIP_DEFAULT_OFFSET,
    delay = TOOLTIP_DEFAULT_DELAY,
    restMs = TOOLTIP_DEFAULT_REST_MS,
    allowFlip,
    stayInFrame: _stayInFrame,
    strategy,
  } = props

  // Semi-controlled like the legacy TooltipBase: uncontrolled hover/touch state lives
  // here, while a caller-provided `open` stays fully controlled (interactions only
  // REQUEST changes through onOpenChange).
  const isControlled = openProp !== undefined
  const [internalOpen, setInternalOpen] = useState(openProp ?? false)
  const currentOpen = isControlled ? openProp : internalOpen

  const handleOpenChange = useEvent((nextOpen: boolean): void => {
    if (!isControlled) {
      setInternalOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  })

  const config = useMemo(
    () => ({
      placement,
      offset,
      allowFlip,
      strategy,
      requestOpenChange: handleOpenChange,
      isOpen: currentOpen,
      ...mapTooltipDelay({ delay, restMs }),
    }),
    [placement, offset, allowFlip, strategy, handleOpenChange, currentOpen, delay, restMs],
  )

  return (
    <TooltipPrimitive.Root open={currentOpen} onOpenChange={handleOpenChange}>
      <TooltipConfigContext.Provider value={config}>{children}</TooltipConfigContext.Provider>
    </TooltipPrimitive.Root>
  )
}

/**
 * Renders a plain `div` wrapper like the legacy Tamagui trigger stack (not a native
 * button) so arbitrary trigger content keeps its own semantics; with `asChild`, the
 * child element itself becomes the trigger, like Tamagui — the resolved style props
 * and `onPress` are clone-merged onto the child (its own style/onClick/ref preserved
 * and composed).
 */
const TooltipTrigger = forwardRef<HTMLDivElement, TooltipTriggerProps>(function TooltipTrigger(props, ref) {
  const { children, asChild, onPress, testID, ...styleProps } = props
  const colors = useSporeColors()
  const { openDelayMs, closeDelayMs, requestOpenChange, isOpen } = useContext(TooltipConfigContext)
  const resolvedCallerStyle = resolveTooltipStyleProps(colors, styleProps)

  // Touch affordance + tap-away lifecycle — see useTooltipTouchSession.
  const triggerNodeRef = useRef<HTMLDivElement | null>(null)
  const { handleTouchPointerDown } = useTooltipTouchSession({ isOpen, requestOpenChange, triggerNodeRef })

  const renderAsChild = asChild === true && isValidElement(children)
  const child = renderAsChild ? (children as ReactElement<Record<string, unknown>>) : undefined
  const childRef = child?.props['ref'] as Ref<HTMLDivElement> | undefined
  // Composed once at the top level (memoized on the ref identities) so function refs
  // don't see ref(null)/ref(node) churn from a fresh composed callback every render.
  // In the non-asChild path childRef is undefined and composeRefs skips the slot.
  const composedTriggerRef = useComposedRefs<HTMLDivElement>(childRef, triggerNodeRef, ref)

  if (child !== undefined) {
    const childStyle = child.props['style'] as CSSProperties | undefined
    const childOnClick = child.props['onClick']
    const childOnPointerDown = child.props['onPointerDown']
    const composedClick = (event: MouseEvent<HTMLDivElement>): void => {
      if (typeof childOnClick === 'function') {
        childOnClick(event)
      }
      onPress?.()
    }
    const composedPointerDown = (event: PointerEvent<HTMLElement>): void => {
      if (typeof childOnPointerDown === 'function') {
        childOnPointerDown(event)
      }
      handleTouchPointerDown(event)
    }
    const renderElement = cloneElement(child, {
      // Conditional spreads: cloneElement config values override even when
      // `undefined`, which would wipe a child's own data-testid or style.
      ...(testID !== undefined ? { 'data-testid': testID } : undefined),
      ...(Object.keys(resolvedCallerStyle).length > 0 || childStyle !== undefined
        ? { style: { ...resolvedCallerStyle, ...childStyle } }
        : undefined),
      ...(onPress !== undefined || childOnClick !== undefined ? { onClick: composedClick } : undefined),
      onPointerDown: composedPointerDown,
      ref: composedTriggerRef,
    })
    // The child IS the render element — no `children` prop alongside `render`, so
    // Base UI can never apply one as a content wipe.
    return (
      <TooltipPrimitive.Trigger
        data-slot="ui-tooltip-trigger"
        delay={openDelayMs}
        closeDelay={closeDelayMs}
        closeOnClick={false}
        render={renderElement}
      />
    )
  }

  return (
    <TooltipPrimitive.Trigger
      data-slot="ui-tooltip-trigger"
      delay={openDelayMs}
      closeDelay={closeDelayMs}
      // Legacy hover-driven tooltips never closed on trigger click (Base UI defaults to
      // closing); a click mid-hover keeping the tip open matches the legacy engine.
      closeOnClick={false}
      data-testid={testID}
      // The forwarded ref rides the render div: Base UI types the Trigger's own ref
      // as HTMLButtonElement, but the legacy trigger surface is a plain div.
      render={
        // oxlint-disable-next-line react/forbid-elements -- Flex is Tamagui, which this rebuild removes (see file docstring)
        <div ref={composedTriggerRef} style={{ ...FRAME_BASE_STYLE, ...resolvedCallerStyle }} />
      }
      onClick={onPress}
      onPointerDown={handleTouchPointerDown}
    >
      {children}
    </TooltipPrimitive.Trigger>
  )
})

const TooltipContent = forwardRef<HTMLDivElement, TooltipContentProps>(function TooltipContent(props, ref) {
  const { children, animationDirection = 'top', zIndex, testID, onPress, ...styleProps } = props
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()
  const config = useContext(TooltipConfigContext)

  // Reads the parent modal/sheet/popover's effective z-index (provided by
  // AdaptiveWebModal / AdaptiveWebPopoverContent) and renders one layer above it,
  // floored at zIndexes.tooltip — so tooltips stack consistently with sibling popovers.
  const effectiveModalZ = useContext(EffectiveModalOrSheetZIndexContext)
  const stackingLayerNumber = zIndex ?? stackingLayerAbove(effectiveModalZ, zIndexes.tooltip)

  const { side, align } = mapPlacementToAnchorPosition(config.placement)
  const { sideOffset, alignOffset } = mapOffsetToAnchorPosition({ offset: config.offset, align })

  // Caller styles merge over the frame defaults per concrete edge — the resolver
  // expands `p`/`px`/`paddingVertical`/… into longhand edges, reproducing Tamagui's
  // insertion-ordered alias folding (a call-site `p: 0` zeroes all four edges while
  // `paddingVertical: 8` keeps the default horizontal 12).
  const frame: CSSProperties = {
    ...contentFrameStyle({ colors, isDarkMode }),
    ...resolveTooltipStyleProps(colors, styleProps),
  }

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        data-slot="ui-tooltip-positioner"
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        positionMethod={config.strategy}
        // allowFlip={false} disables side flipping (incl. the perpendicular-axis
        // fallback) but keeps align-axis shifting — legacy allowFlip only removed the
        // flip middleware, never shift.
        collisionAvoidance={
          config.allowFlip === false ? { side: 'none', align: 'shift', fallbackAxisSide: 'none' } : undefined
        }
        // pointerEvents 'none': Base UI only inerts the positioner while closed
        // (usePositioner applies it from `inert`), so an open positioner would swallow
        // clicks aimed beneath the tooltip rect — the legacy tooltip was fully
        // click-through. Interactive call sites re-enable via pointerEvents="auto" on
        // Content, which lands on the popup (a child re-enables under an inert parent).
        style={{ isolation: 'isolate', outline: 'none', pointerEvents: 'none', zIndex: stackingLayerNumber }}
      >
        <TooltipPrimitive.Popup
          ref={ref}
          data-slot={TOOLTIP_POPUP_DATA_SLOT}
          data-testid={testID}
          render={(popupProps, state) => (
            // oxlint-disable-next-line react/forbid-elements -- Flex is Tamagui, which this rebuild removes (see file docstring)
            <div
              {...popupProps}
              style={{ ...popupProps.style, ...frame, ...motionStyle(animationDirection, state.transitionStatus) }}
            />
          )}
          onClick={onPress}
        >
          <DualZIndexProvider value={stackingLayerNumber}>{children}</DualZIndexProvider>
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
})

/**
 * `backgroundColor`/`borderColor` overrides are honored (the legacy styled arrow applied
 * them — Coachmark needs them now that the portal escapes Tamagui's `Theme inverse`
 * DOM scope); the rest of the accepted style surface stays inert, like every repo call
 * site expects (all render the arrow bare).
 */
function TooltipArrow(props: TooltipArrowProps): JSX.Element {
  const { backgroundColor, borderColor } = props
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()
  return (
    <TooltipPrimitive.Arrow
      data-slot="ui-tooltip-arrow"
      render={(arrowProps, state) => {
        const side = arrowSideOf(state.side)
        return (
          // oxlint-disable-next-line react/forbid-elements -- Flex is Tamagui, which this rebuild removes (see file docstring)
          <div {...arrowProps} style={{ ...arrowProps.style, ...arrowWindowStyle(side) }}>
            {/* oxlint-disable-next-line react/forbid-elements -- Flex is Tamagui, which this rebuild removes (see file docstring) */}
            <div
              data-slot="ui-tooltip-arrow-inner"
              style={{
                ...arrowInnerStyle({ side, colors, isDarkMode }),
                ...(backgroundColor !== undefined
                  ? { backgroundColor: resolveTooltipColor(colors, backgroundColor) }
                  : undefined),
                ...(borderColor !== undefined ? { borderColor: resolveTooltipColor(colors, borderColor) } : undefined),
              }}
            />
          </div>
        )
      }}
    />
  )
}

export const Tooltip = Object.assign(TooltipRoot, {
  Trigger: TooltipTrigger,
  Content: TooltipContent,
  Arrow: TooltipArrow,
})
