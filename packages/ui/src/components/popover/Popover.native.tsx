import { useSporeColors } from '@universe/mycelium'
import { FloatingOverlayContent, FloatingOverlayRoot } from '@universe/mycelium/floating-overlay'
import {
  Children,
  type ForwardedRef,
  forwardRef,
  isValidElement,
  type ReactNode,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Animated, View, type ViewStyle } from 'react-native'
import {
  NativePopoverConfigContext,
  type NativePopoverConfigContextValue,
  PopoverFrameSlotContext,
  popoverNoop,
} from 'ui/src/components/popover/popoverContexts'
import {
  PopoverAdapt,
  PopoverAnchor,
  PopoverArrow,
  PopoverClose,
  PopoverTrigger,
} from 'ui/src/components/popover/PopoverInternal.native'
import { resolveNativeStyle } from 'ui/src/components/popover/popoverNativeHelpers'
import { resolvePopoverZIndex } from 'ui/src/components/popover/popoverStyleResolution'
import {
  POPOVER_CONTENT_BORDER_RADIUS,
  POPOVER_CONTENT_PADDING,
  POPOVER_TRANSITION_DURATION_MS,
  resolveNativeViewportPadding,
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
 * Native leg of the rebuilt Popover (INFRA-3318), on the mycelium
 * floating-overlay primitive (INFRA-2965) instead of the Tamagui popper/portal
 * stack. The legacy Tamagui native Popover (v1.136.1 `Popover.native.js`) renders
 * REAL floating content on native — Popper-positioned content in a portal with a
 * full-screen press-to-dismiss layer (live mobile surfaces: the dapp-request
 * AccountSelectPopover, CopyToClipboard's copied-confirmation) — so this leg
 * reproduces that contract:
 *
 * - Root owns open state (controlled when `open` is set) and the imperative
 *   handle; Trigger toggles on press and doubles as the anchor unless a custom
 *   `Popover.Anchor` is present (the legacy `hasCustomAnchor` behavior).
 * - Content portals into the nearest `FloatingOverlayProvider` layer (mounted at
 *   the mobile app root), positioned by the pure geometry engine
 *   (offset → flip → shift, the same grammar as the legacy floating-ui
 *   middleware), with a full-screen backdrop that dismisses on outside press and
 *   Android back — like the legacy fullscreen YStack + Dismissable.
 * - Frame defaults transcribe the legacy `PopperContentFrame` (`$background`,
 *   padding 8, radius 0, centered) resolved through useSporeColors.
 * - Enter motion is a 150ms fade; the legacy animated exit is ledgered (content
 *   unmounts immediately) — the executed device screenshot-diff is owed on the PR.
 * - Trigger / Anchor / Close / Arrow / Adapt live in PopoverInternal.native.tsx.
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
    strategy: _strategy,
    hoverable: _hoverable,
    keepChildrenMounted: _keepChildrenMounted,
    disableFocus: _disableFocus,
  } = props

  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false)
  const open = openProp ?? uncontrolledOpen
  const [arrowSize, setArrowSize] = useState(0)
  const [hasCustomAnchor, setHasCustomAnchor] = useState(false)
  const [virtualRect, setVirtualRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

  const setOpen = useEvent((next: boolean, via?: PopoverVia): void => {
    if (openProp === undefined) {
      setUncontrolledOpen(next)
    }
    if (next !== open) {
      onOpenChange?.(next, via)
    }
  })

  useImperativeHandle(
    ref,
    () => ({
      anchorTo: (rect): void => setVirtualRect(rect),
      toggle: (): void => setOpen(!open),
      open: (): void => setOpen(true),
      close: (): void => setOpen(false),
      setOpen: (next: boolean): void => setOpen(next),
    }),
    [open, setOpen],
  )

  const config = useMemo<NativePopoverConfigContextValue>(
    () => ({
      open,
      setOpen,
      placement,
      offset,
      stayInFrame,
      allowFlip,
      arrowSize,
      onArrowSize: setArrowSize,
      hasCustomAnchor,
      onCustomAnchorChange: setHasCustomAnchor,
    }),
    [open, setOpen, placement, offset, stayInFrame, allowFlip, arrowSize, hasCustomAnchor],
  )

  const handleOverlayOpenChange = useEvent((next: boolean): void => {
    // The floating-overlay only requests closes (backdrop press / back press).
    setOpen(next, 'press')
  })

  return (
    <FloatingOverlayRoot
      open={open}
      anchorPoint={virtualRect !== null ? { x: virtualRect.x, y: virtualRect.y } : undefined}
      onOpenChange={handleOverlayOpenChange}
    >
      <NativePopoverConfigContext.Provider value={config}>{children}</NativePopoverConfigContext.Provider>
    </FloatingOverlayRoot>
  )
})

/**
 * The content FRAME: the element that directly parents the popover children, like
 * the legacy `PopperContentFrame`. It must carry every child-layout style —
 * `gap`/`rowGap`/`columnGap`/`alignItems`/… have no effect one level up on the
 * primitive's positioned wrapper (whose only child is this frame; caught by the
 * INFRA-3318 device diff: AccountSelectPopover's `gap="$gap20"` lost 20dp of row
 * spacing).
 *
 * The 150ms mount fade approximating the legacy enter animation (exit is
 * ledgered) rides a ZERO-STYLED Animated.View at the positioned wrapper's origin
 * that parents both this frame and the hoisted arrows — the arrow fades with the
 * bubble like legacy (it rendered inside the Tamagui-animated content), while
 * its containing block keeps zero border/padding so the padded-frame
 * displacement bug cannot recur.
 */
function ContentFrame({
  style,
  arrows,
  frameRef,
  children,
}: {
  style: ViewStyle
  arrows: ReactNode
  frameRef: ForwardedRef<View>
  children: ReactNode
}): JSX.Element {
  const opacity = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: POPOVER_TRANSITION_DURATION_MS,
      useNativeDriver: true,
    }).start()
  }, [opacity])
  return (
    <Animated.View style={{ opacity }} testID="ui-popover-native-fade">
      <View ref={frameRef} style={style} testID="ui-popover-native-frame">
        <PopoverFrameSlotContext.Provider value={true}>{children}</PopoverFrameSlotContext.Provider>
      </View>
      {arrows}
    </Animated.View>
  )
}

const PopoverContent = forwardRef<View, PopoverContentProps>(function PopoverContent(props, ref) {
  // Only these props drive native behavior. The web-only behavior props left in the
  // rest bag are inert: the style resolver reads known style keys only, and the
  // web-only `$<mediaKey>` overrides are stripped below.
  const { children, onPointerDownOutside, onInteractOutside, zIndex, testID, ...styleAndMediaProps } = props
  const config = useContext(NativePopoverConfigContext)
  const colors = useSporeColors()

  const styleProps = Object.fromEntries(
    Object.entries(styleAndMediaProps as Record<string, unknown>).filter(([key]) => !key.startsWith('$')),
  )

  const frameStyle: ViewStyle = {
    alignItems: 'center',
    backgroundColor: String(colors.background.val),
    borderRadius: POPOVER_CONTENT_BORDER_RADIUS,
    padding: POPOVER_CONTENT_PADDING,
    ...resolveNativeStyle(colors, styleProps),
  }

  const handlePressOutside = useEvent((): void => {
    // Legacy Dismissable payload approximation for the outside-press interceptors.
    // Structural stand-in for CustomEvent (not in the Hermes runtime); the
    // floating-overlay backdrop offers no cancel hook, so preventDefault is a no-op —
    // no native call site drives these interceptors today.
    const synthetic = {
      type: 'dismissable.pointerDownOutside',
      detail: { originalEvent: undefined as unknown as PointerEvent },
      defaultPrevented: false,
      preventDefault: popoverNoop,
    } as unknown as CustomEvent<{ originalEvent: PointerEvent }>
    onPointerDownOutside?.(synthetic)
    onInteractOutside?.(synthetic)
  })

  const childArray = Children.toArray(children)
  const arrowChildren = childArray.filter((child) => isValidElement(child) && child.type === PopoverArrow)
  const frameChildren = childArray.filter((child) => !(isValidElement(child) && child.type === PopoverArrow))

  const offsetValue = config.offset ?? config.arrowSize
  // One source of truth with the web mapper (shared.ts): uniform padding maps
  // directly; per-side padding lowers to its largest side (engine takes one number).
  const viewportPadding = resolveNativeViewportPadding(config.stayInFrame)

  return (
    <FloatingOverlayContent
      dismissOnPressOutside
      dismissOnBackPress
      placement={config.placement}
      offset={offsetValue}
      flip={config.allowFlip !== undefined && config.allowFlip !== false}
      viewportPadding={viewportPadding}
      zIndex={resolvePopoverZIndex(zIndex) ?? zIndexes.popover}
      testID={testID}
      onPressOutside={handlePressOutside}
    >
      {/* All frame styles ride the child-parenting element (the primitive's own
          wrapper only positions; gap/alignItems there would target this single
          frame, not the popover children). The arrow must stay OUTSIDE the
          padded/bordered frame: FloatingOverlayArrow computes absolute insets
          (`top: -arrowSize`, …) against the wrapper's origin, but Yoga resolves
          an absolute child's insets against its parent's content box — inside the
          frame the triangle lands border+padding lower/right, INSIDE the bubble
          instead of protruding from its edge (caught by the INFRA-3318 device
          diff on CopyToClipboard). Hoisted Popover.Arrow elements render on the
          zero-styled fade wrapper as siblings of the frame; every live native
          call site renders the arrow as a direct Content child (nested arrows
          fall back to the frame slot and warn in dev). */}
      <ContentFrame style={frameStyle} arrows={arrowChildren} frameRef={ref}>
        {frameChildren}
      </ContentFrame>
    </FloatingOverlayContent>
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
