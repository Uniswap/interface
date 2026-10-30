import { Popover as PopoverPrimitive, type PopoverRootActions } from '@base-ui/react/popover'
import { useSporeColors } from '@universe/mycelium'
import { OVERLAY_PORTAL_CONTAINER_ATTRIBUTE } from '@universe/mycelium/popover-compat'
import {
  createContext,
  type CSSProperties,
  forwardRef,
  useContext,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
// From the shared module, not the AdaptiveWebModal barrel: the barrel pulls ui/src Flex, which
// would put tamagui back in this file's graph.
import {
  DualZIndexProvider,
  EffectiveModalOrSheetZIndexContext,
  stackingLayerAbove,
} from 'ui/src/components/modal/AdaptiveWebModalShared'
import {
  type BaseUIChangeDetails,
  type PopoverDismissInterceptors,
  WebPopoverConfigContext,
  type WebPopoverConfigContextValue,
} from 'ui/src/components/popover/popoverContexts'
import {
  PopoverAdapt,
  PopoverAnchor,
  PopoverArrow,
  PopoverClose,
  PopoverTrigger,
} from 'ui/src/components/popover/PopoverInternal.web'
import { resolvePopoverWebStyle, resolvePopoverZIndex } from 'ui/src/components/popover/popoverStyleResolution'
import {
  contentFrameStyle,
  motionStyle,
  runDismissInterceptors,
  splitMediaProps,
  useMediaStyleOverrides,
  viaFromReason,
} from 'ui/src/components/popover/popoverWebHelpers'
import {
  mapHoverableToDelays,
  mapOffsetToAnchorPosition,
  mapPlacementToAnchorPosition,
  resolveCollisionPadding,
} from 'ui/src/components/popover/shared'
import type {
  PopoverContentProps,
  PopoverImperativeHandle,
  PopoverProps,
  PopoverVia,
} from 'ui/src/components/popover/types'
import { zIndexes } from 'ui/src/theme/zIndexes'
import { useEvent } from 'utilities/src/react/hooks'

/**
 * Web leg of the rebuilt Popover (INFRA-3318): Base UI's popover engine (the same
 * portal + positioner + popup parts as mycelium's popover-compat, INFRA-3021) under
 * the legacy `ui/src` export surface, styled exclusively with inline styles resolved
 * through useSporeColors — no Tamagui, no class emission (INFRA-3285 keeps
 * `packages/ui` out of every Tailwind `@source` scan).
 *
 * Legacy behaviors kept: the Tamagui root defaults (placement `bottom`, shift-into-
 * viewport ON, flip OFF, offset falling back to the registered arrow size),
 * fully-controlled-when-`open`-is-set semantics with the imperative ref handle
 * (`anchorTo`/`toggle`/`open`/`close`/`setOpen`), the `PopperContentFrame` styled
 * defaults, focus trapping while open (`trapFocus ?? open` → Base UI
 * `modal="trap-focus"` + an always-registered hidden close part, since Base UI only
 * arms the trap once a close part exists), the FocusScope / Dismissable handler
 * surface, the
 * `Adapt`-to-sheet displacement (`Adapt.Contents` teleports content into the adapt
 * template via a real portal, so React context is preserved — the legacy
 * `AdaptPortalContents` behavior), and the modal/sheet stacking bridge (content
 * renders one layer above `EffectiveModalOrSheetZIndexContext`, floored at
 * `zIndexes.popover`, and RE-PROVIDES the bumped layer to its children).
 *
 * Trigger / Anchor / Close / Arrow / Adapt live in PopoverInternal.web.tsx.
 */

const PopoverRoot = forwardRef<PopoverImperativeHandle, PopoverProps>(function PopoverRoot(props, ref) {
  const {
    children,
    open: openProp,
    defaultOpen,
    onOpenChange,
    placement,
    offset,
    stayInFrame,
    allowFlip,
    strategy,
    hoverable,
    keepChildrenMounted: _keepChildrenMounted,
    disableFocus: _disableFocus,
  } = props

  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false)
  const open = openProp ?? uncontrolledOpen

  const [arrowSize, setArrowSize] = useState(0)
  const [anchorElement, setAnchorElement] = useState<Element | null>(null)
  // State, not a ref: the trigger's mount has to re-render Content BEFORE the first open — a
  // hover/click open re-renders nothing above the popup, so a ref read there would still be null.
  // Open-at-mount (`open`/`defaultOpen`) outruns state too: it portals to body for one pre-paint
  // frame, then re-portals, remounting the popup. Tolerable only while nothing opens at mount.
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null)
  const [virtualRect, setVirtualRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [adaptActive, setAdaptActive] = useState(false)
  const [adaptContainer, setAdaptContainer] = useState<HTMLElement | null>(null)
  const [trapFocusMode, setTrapFocusMode] = useState<false | 'trap-focus'>('trap-focus')
  const dismissInterceptorsRef = useMemo<{ current: PopoverDismissInterceptors | null }>(() => ({ current: null }), [])

  const setOpen = useEvent((next: boolean, via?: PopoverVia): void => {
    if (openProp === undefined) {
      setUncontrolledOpen(next)
    }
    if (next !== open) {
      onOpenChange?.(next, via)
    }
  })

  const baseUIActionsRef = useRef<PopoverRootActions | null>(null)
  const pendingCloseViaRef = useRef<PopoverVia | undefined>(undefined)

  // Wrapper-initiated changes (imperative handle, Popover.Close). Closes route
  // through Base UI's imperative close: a bare controlled-prop flip skips its
  // open-event bookkeeping, leaving a click-open recorded forever and hover-open
  // (`hoverable`) permanently suppressed on that instance.
  const requestSetOpen = useEvent((next: boolean, via?: PopoverVia): void => {
    const actions = baseUIActionsRef.current
    if (!next && actions !== null) {
      pendingCloseViaRef.current = via
      actions.close()
      return
    }
    setOpen(next, via)
  })

  const handleBaseUIOpenChange = useEvent((next: boolean, details?: BaseUIChangeDetails): void => {
    const pendingCloseVia = pendingCloseViaRef.current
    pendingCloseViaRef.current = undefined
    if (!next) {
      // No Popup mounts while adapted (content portals into the sheet), so Base UI
      // classifies presses on the teleported content itself as outside presses —
      // swallow exactly those. Overlay/backdrop presses and Escape dismiss normally
      // (sheet convention).
      if (
        adaptActive &&
        details?.reason === 'outside-press' &&
        adaptContainer !== null &&
        details.event?.target instanceof Node &&
        adaptContainer.contains(details.event.target)
      ) {
        details.cancel?.()
        return
      }
      const interceptors = dismissInterceptorsRef.current
      if (interceptors !== null && details !== undefined && runDismissInterceptors(interceptors, details)) {
        // Legacy prevent-dismiss: swallow the request (and stop Base UI's own handling).
        details.cancel?.()
        return
      }
    }
    // An imperative-action close is a `requestSetOpen` round trip — carry its via.
    setOpen(next, details?.reason === 'imperative-action' ? pendingCloseVia : viaFromReason(details?.reason))
  })

  useImperativeHandle(
    ref,
    () => ({
      anchorTo: (rect): void => setVirtualRect(rect),
      toggle: (): void => requestSetOpen(!open),
      open: (): void => requestSetOpen(true),
      close: (): void => requestSetOpen(false),
      setOpen: (next: boolean): void => requestSetOpen(next),
    }),
    [open, requestSetOpen],
  )

  const { openOnHover, openDelayMs, closeDelayMs } = mapHoverableToDelays(hoverable)

  const config = useMemo<WebPopoverConfigContextValue & { setTrapFocusMode: (mode: false | 'trap-focus') => void }>(
    () => ({
      open,
      setOpen: requestSetOpen,
      placement,
      offset,
      stayInFrame,
      allowFlip,
      strategy,
      openOnHover,
      openDelayMs,
      closeDelayMs,
      arrowSize,
      onArrowSize: setArrowSize,
      anchorElement,
      setAnchorElement,
      triggerElement,
      setTriggerElement,
      virtualRect,
      adaptActive,
      setAdaptActive,
      adaptContainer,
      setAdaptContainer,
      dismissInterceptorsRef,
      setTrapFocusMode,
    }),
    [
      open,
      requestSetOpen,
      placement,
      offset,
      stayInFrame,
      allowFlip,
      strategy,
      openOnHover,
      openDelayMs,
      closeDelayMs,
      arrowSize,
      anchorElement,
      triggerElement,
      virtualRect,
      adaptActive,
      adaptContainer,
      dismissInterceptorsRef,
    ],
  )

  return (
    <PopoverPrimitive.Root
      open={open}
      modal={trapFocusMode}
      actionsRef={baseUIActionsRef}
      onOpenChange={handleBaseUIOpenChange}
    >
      <TrapFocusModeContext.Provider value={setTrapFocusMode}>
        <WebPopoverConfigContext.Provider value={config}>{children}</WebPopoverConfigContext.Provider>
      </TrapFocusModeContext.Provider>
    </PopoverPrimitive.Root>
  )
})

/** Content registers the legacy trapFocus/disableFocusScope choice up to the root. */
const TrapFocusModeContext = createContext<(mode: false | 'trap-focus') => void>(() => {})

function virtualElementFor(rect: { x: number; y: number; width: number; height: number }): {
  getBoundingClientRect: () => DOMRect
} {
  return {
    getBoundingClientRect: (): DOMRect => DOMRect.fromRect(rect),
  }
}

const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(function PopoverContent(props, ref) {
  // Unsupported legacy props (animation/animateOnly/enableRemoveScroll/
  // freezeContentsWhenHidden/lazyMount/elevate) ride the rest bag and are inert:
  // splitMediaProps only forwards them to the style resolver, which reads known
  // style keys only.
  const {
    children,
    enterStyle,
    exitStyle,
    trapFocus,
    disableFocusScope,
    onOpenAutoFocus,
    onCloseAutoFocus,
    onEscapeKeyDown,
    onPointerDownOutside,
    onFocusOutside,
    onInteractOutside,
    zIndex,
    testID,
    'data-testid': dataTestId,
    id,
    role,
    onPress,
    onPressIn,
    onPressOut,
    ...styleAndMediaProps
  } = props
  const colors = useSporeColors()
  const config = useContext(WebPopoverConfigContext)
  const setTrapFocusMode = useContext(TrapFocusModeContext)

  const { styleProps, mediaProps } = splitMediaProps(styleAndMediaProps as Record<string, unknown>)
  const mediaOverrides = useMediaStyleOverrides(colors, mediaProps)

  // Registered every render — the legacy Dismissable handlers close over
  // current props, and the root reads the ref only inside close requests.
  config.dismissInterceptorsRef.current = {
    onEscapeKeyDown,
    onPointerDownOutside,
    onFocusOutside,
    onInteractOutside,
  }

  // Legacy `trapFocus ?? context.open`: the web popover trapped focus while open
  // unless explicitly opted out.
  const wantedTrapMode = trapFocus === false || disableFocusScope === true ? false : ('trap-focus' as const)
  useLayoutEffect(() => {
    setTrapFocusMode(wantedTrapMode)
  }, [setTrapFocusMode, wantedTrapMode])

  const effectiveModalZ = useContext(EffectiveModalOrSheetZIndexContext)
  const stackingLayerNumber = resolvePopoverZIndex(zIndex) ?? stackingLayerAbove(effectiveModalZ, zIndexes.popover)

  const { side, align } = mapPlacementToAnchorPosition(config.placement)
  const { sideOffset, alignOffset } = mapOffsetToAnchorPosition({
    offset: config.offset,
    align,
    arrowSize: config.arrowSize,
  })

  const initialFocus = useMemo(() => {
    if (disableFocusScope === true) {
      return false as const
    }
    if (onOpenAutoFocus === undefined) {
      return undefined
    }
    return (): boolean | undefined => {
      const event = new Event('focusScope.autoFocusOnMount', { cancelable: true })
      onOpenAutoFocus(event)
      return event.defaultPrevented ? false : undefined
    }
  }, [disableFocusScope, onOpenAutoFocus])

  const finalFocus = useMemo(() => {
    if (disableFocusScope === true || onCloseAutoFocus === false) {
      return false as const
    }
    if (onCloseAutoFocus === undefined) {
      return undefined
    }
    return (): boolean | undefined => {
      const event = new Event('focusScope.autoFocusOnUnmount', { cancelable: true })
      onCloseAutoFocus(event)
      return event.defaultPrevented ? false : undefined
    }
  }, [disableFocusScope, onCloseAutoFocus])

  // A focus-trapping host modal marks its content element (AdaptiveWebModal.web.tsx) so the
  // popup portals INSIDE the trap's subtree: a Radix modal Dialog's FocusScope yanks focus back
  // on every focusin, so a body-portaled popup's inputs can be clicked but never typed into.
  // Unmarked hosts resolve nothing and keep the plain document.body portal. The anchor is the
  // fallback walk-up node for anchor-only trees (no `Popover.Trigger`); a virtual-rect `anchorTo`
  // has no node at all and stays uncontained.
  const triggerElement = config.triggerElement
  const anchorElement = config.anchorElement
  const hostPortalContainer = useMemo(
    () =>
      (triggerElement ?? anchorElement)?.closest<HTMLElement>(`[${OVERLAY_PORTAL_CONTAINER_ATTRIBUTE}]`) ?? undefined,
    [triggerElement, anchorElement],
  )

  // Caller styles merge over the frame defaults per concrete edge — the resolver
  // expands `p`/`px`/`paddingVertical`/… into longhand edges, reproducing Tamagui's
  // insertion-ordered alias folding.
  const frame: CSSProperties = {
    ...contentFrameStyle(colors),
    ...resolvePopoverWebStyle(colors, styleProps),
    ...mediaOverrides,
  }

  const testId = dataTestId ?? testID

  // Adapt displacement: when the breakpoint template is active, content teleports
  // into `Popover.Adapt.Contents` (a real portal, so React context is preserved) —
  // the legacy `AdaptPortalContents` behavior.
  if (config.adaptActive) {
    if (config.adaptContainer === null) {
      return null
    }
    return createPortal(children, config.adaptContainer)
  }

  const anchor =
    config.anchorElement ?? (config.virtualRect !== null ? virtualElementFor(config.virtualRect) : undefined)

  // Legacy middleware mapping: shift-into-viewport ON by default (`stayInFrame`
  // default true on the Tamagui root), flip only when `allowFlip` is set.
  const collisionAvoidance = {
    side: config.allowFlip !== undefined && config.allowFlip !== false ? ('flip' as const) : ('none' as const),
    align: config.stayInFrame === false ? ('none' as const) : ('shift' as const),
    fallbackAxisSide: 'none' as const,
  }
  // Always explicit: legacy shift/flip default padding is 0, Base UI's is 5.
  const collisionPadding = resolveCollisionPadding(config.stayInFrame)

  return (
    <PopoverPrimitive.Portal container={hostPortalContainer}>
      <PopoverPrimitive.Positioner
        data-slot="ui-popover-positioner"
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        // Contained inside the host's scrolling content box, `fixed` is what escapes its
        // `overflow: auto` clip; floating-ui's autoUpdate re-anchors on scroll either way.
        positionMethod={hostPortalContainer === undefined ? config.strategy : 'fixed'}
        collisionAvoidance={collisionAvoidance}
        collisionPadding={collisionPadding}
        anchor={anchor}
        // Radix modal mode sets body pointer-events:none, and this portal lives outside the
        // modal subtree, so an open popover must re-enable them or clicks and scroll fall through
        // to the modal beneath. Gated on open so a closed positioner keeps Base UI's inert `none`.
        style={{
          isolation: 'isolate',
          outline: 'none',
          zIndex: stackingLayerNumber,
          pointerEvents: config.open ? 'auto' : undefined,
        }}
      >
        <PopoverPrimitive.Popup
          ref={ref}
          data-slot="ui-popover-popup"
          data-testid={testId}
          id={id}
          role={role as never}
          initialFocus={initialFocus}
          finalFocus={finalFocus}
          render={(popupProps, state) => (
            // oxlint-disable-next-line react/forbid-elements -- the rebuilt popup IS the raw DOM boundary (no Tamagui Flex here)
            <div
              {...popupProps}
              style={{
                ...popupProps.style,
                ...frame,
                ...motionStyle({ enterStyle, exitStyle, transitionStatus: state.transitionStatus }),
              }}
            />
          )}
          onClick={onPress}
          onMouseDown={onPressIn as never}
          onMouseUp={onPressOut as never}
        >
          {/* Base UI 1.6 arms its FloatingFocusManager trap only when `modal !== false`
              AND a close part has registered on the popup (`hasClosePart` in
              PopoverPopup) — its escape hatch for touch/AT users. Our Popover.Close is
              a plain div (legacy contract), so nothing registers and `trap-focus`
              would be inert for every consumer. Legacy Tamagui trapped whenever open
              (`trapFocus ?? open`): register a hidden, inert close part
              unconditionally so arming stays governed by the root `modal` prop alone.
              tabIndex -1 + display:none keep it out of the tab order and the a11y
              tree (pinned in the parity suite). */}
          <PopoverPrimitive.Close
            nativeButton={false}
            render={
              <span aria-hidden data-slot="ui-popover-close-sentinel" tabIndex={-1} style={{ display: 'none' }} />
            }
          />
          <DualZIndexProvider value={stackingLayerNumber}>{children}</DualZIndexProvider>
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
})

export const Popover = Object.assign(PopoverRoot, {
  Trigger: PopoverTrigger,
  Anchor: PopoverAnchor,
  Content: PopoverContent,
  Close: PopoverClose,
  Arrow: PopoverArrow,
  Adapt: PopoverAdapt,
})

/**
 * Legacy type/value merge: `useRef<Popover>` at call sites resolves to the
 * imperative handle (`anchorTo`/`toggle`/`open`/`close`/`setOpen`).
 */
export type Popover = PopoverImperativeHandle
