/**
 * The tooltip-compat class compilers and pure mappers. The content frame
 * defaults mirror the legacy `ContentInner` styled config verbatim
 * (`ui/src/components/tooltip/Tooltip.web.tsx`), layered under the call
 * site's own Tooltip.Content style props via the shared Flex compat compiler
 * (tailwind-merge semantics — caller wins). Enter/exit motion is expressed as
 * Base UI starting/ending-style transitions mirroring the legacy ±4px fade
 * per `animationDirection`; hover timing maps the Tamagui delay/restMs pair
 * onto the Base UI trigger delay/closeDelay (both ledgered).
 */
import { cn } from '../cn'
import { flexCompatClassName } from '../flex-compat/compile'
import type { FlexCompatProps } from '../flex-compat/props'
import type { TooltipAnimationDirection, TooltipCompatDelay, TooltipContentCompatProps } from './props'

/** Legacy ui/src TooltipRoot styled defaults (Tooltip.web.tsx). */
export const TOOLTIP_DEFAULT_OFFSET = { mainAxis: 16 } as const
export const TOOLTIP_DEFAULT_DELAY = { close: 500, open: 0 } as const
export const TOOLTIP_DEFAULT_REST_MS = 200

/**
 * Legacy `ContentInner` styled defaults — including the light-theme shadow.
 * The popper frame's own contributions (column stack, `alignItems: 'center'`)
 * are covered by the Flex compat base classes and the explicit entries below.
 * The legacy `$theme-dark` block only zeroes the shadow offset/radius with no
 * color or opacity, which Tamagui-web emits as NO box-shadow at all — so the
 * compat emits nothing in dark either (pinned by the parity matrix). Shadow
 * radii are the resolved px values ($spacing12 = 12): the shared shadow
 * compiler composes raw box-shadow lengths.
 */
export const TOOLTIP_CONTENT_FRAME_DEFAULTS: FlexCompatProps = {
  gap: '$spacing8',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '$surface1',
  borderRadius: '$rounded12',
  maxWidth: 350,
  px: '$spacing12',
  py: '$spacing12',
  borderWidth: 1,
  borderColor: '$surface3',
  '$theme-light': {
    shadowColor: '$surface3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
  },
}

/**
 * Legacy `Arrow` styled defaults (12px rotated square), minus the uniform
 * `borderWidth`: the border is drawn per-side on the OUTER edges only (see
 * `tooltipArrowInnerCompatClassName`) so the arrow merges with the popup body
 * as one continuous shape instead of stamping its full outline over it.
 */
const TOOLTIP_ARROW_FRAME_DEFAULTS: FlexCompatProps = {
  width: 12,
  height: 12,
  backgroundColor: '$surface1',
  borderColor: '$surface3',
  '$theme-light': {
    shadowColor: '$surface3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
}

const NON_STYLE_KEYS = [
  'children',
  'animationDirection',
  'zIndex',
  'trapFocus',
  'enableRemoveScroll',
  'enableAnimationForPositionChange',
  'size',
  'unstyled',
  'lazyMount',
  'unmountChildrenWhenHidden',
  'flipStyle',
  'arrowBorderColor',
  'arrowBorderWidth',
] as const

function styleProps(props: Partial<TooltipContentCompatProps>): FlexCompatProps {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (!(NON_STYLE_KEYS as readonly string[]).includes(key)) {
      out[key] = value
    }
  }
  return out as FlexCompatProps
}

/**
 * Legacy prop resolution is insertion-ordered: a call-site `p` /
 * `paddingVertical` spread AFTER the frame defaults overrides the default
 * `px`/`py` shorthands (Tamagui folds aliases in object order). The compat
 * pools emit fixed-order classes, so a colliding default must be dropped for
 * the caller's spacing to win — pinned by the parity matrix (BidMarker's
 * `p: 0` and DisconnectButton's `paddingVertical: 8` cases).
 */
const FRAME_SPACING_OVERRIDES: ReadonlyArray<{
  defaultKey: 'px' | 'py'
  callerKeys: ReadonlyArray<keyof FlexCompatProps>
}> = [
  { defaultKey: 'px', callerKeys: ['p', 'padding', 'px', 'paddingHorizontal'] },
  { defaultKey: 'py', callerKeys: ['p', 'padding', 'py', 'paddingVertical'] },
]

function frameDefaultsFor(caller: FlexCompatProps): FlexCompatProps {
  const defaults = { ...TOOLTIP_CONTENT_FRAME_DEFAULTS }
  for (const { defaultKey, callerKeys } of FRAME_SPACING_OVERRIDES) {
    if (callerKeys.some((key) => caller[key] !== undefined)) {
      delete defaults[defaultKey]
    }
  }
  return defaults
}

/**
 * The styling half of the content frame — exactly what the parity matrix
 * byte-diffs against the legacy styled defaults + call-site overrides.
 */
export function tooltipContentFrameClassName(props: Partial<TooltipContentCompatProps>): string {
  const caller = styleProps(props)
  return flexCompatClassName({ ...frameDefaultsFor(caller), ...caller })
}

/**
 * Legacy enter/exit: opacity 0 with a 4px slide from the `animationDirection`
 * side (default 'top' → from below the resting position). Expressed as Base
 * UI `data-starting-style` / `data-ending-style` transition states; timing is
 * the fixed compat approximation of the Tamagui `simple` driver (ledgered).
 *
 * Every class string below is a FULL literal (legacy 4px offset baked in) —
 * never assembled via template literals — so
 * Tailwind's static extraction sees the candidates wherever this source (or
 * a generated class manifest) is scanned. The parity suite compiles them
 * through the real Tailwind engine and fails if any stops emitting CSS
 * (`tooltip-classes.test.ts`).
 */
const TOOLTIP_MOTION_BASE_CLASSES =
  'transition-[transform,opacity] duration-150 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0'
const TOOLTIP_MOTION_OFFSET_CLASSES: Record<TooltipAnimationDirection, string> = {
  left: 'data-starting-style:translate-x-[4px] data-ending-style:translate-x-[4px]',
  right: 'data-starting-style:translate-x-[-4px] data-ending-style:translate-x-[-4px]',
  top: 'data-starting-style:translate-y-[4px] data-ending-style:translate-y-[4px]',
  bottom: 'data-starting-style:translate-y-[-4px] data-ending-style:translate-y-[-4px]',
}

export function tooltipMotionClasses(direction: TooltipAnimationDirection = 'top'): string {
  return cn(TOOLTIP_MOTION_BASE_CLASSES, TOOLTIP_MOTION_OFFSET_CLASSES[direction])
}

/** Compile the full popup className for the given Tooltip.Content props. */
export function tooltipContentCompatClassName(props: Partial<TooltipContentCompatProps>): string {
  return cn(tooltipContentFrameClassName(props), tooltipMotionClasses(props.animationDirection), 'outline-none')
}

/**
 * The arrow is TWO elements, mirroring the legacy Tamagui `PopperArrow`
 * (outer clip window + inner rotated square) so the tip reads as one
 * continuous shape with the popup body (design feedback, INFRA-3021):
 *
 * - the OUTER element (the Base UI `Tooltip.Arrow` part, absolutely
 *   positioned by the positioner along the popup edge; Base UI stamps
 *   `data-side`) is an `overflow-hidden` window, 2×size along the edge and
 *   size+1px deep — protruding `size` (12px) outside the popup and
 *   overlapping it by 1px so the diamond's background paints OVER the
 *   popup's own 1px border where they meet (no seam line through the base);
 * - the INNER element is the legacy 12px rotated square, centered on the
 *   long axis with its center row sitting exactly on the popup border line:
 *   the window clips away the inner half (and the inner half's shadow, like
 *   the legacy outer frame did), so only the protruding tip is visible;
 * - the border is drawn only on the tip's two OUTER edges per side (the same
 *   per-side widths the legacy `PopperArrow` applies), continuing the
 *   popup's outline around the tip instead of outlining a floating square.
 */
export function tooltipArrowCompatClassName(): string {
  return cn(
    'pointer-events-none overflow-hidden',
    'data-[side=top]:bottom-[-12px] data-[side=top]:h-[13px] data-[side=top]:w-[24px]',
    'data-[side=bottom]:top-[-12px] data-[side=bottom]:h-[13px] data-[side=bottom]:w-[24px]',
    'data-[side=left]:right-[-12px] data-[side=left]:h-[24px] data-[side=left]:w-[13px]',
    'data-[side=right]:left-[-12px] data-[side=right]:h-[24px] data-[side=right]:w-[13px]',
  )
}

/**
 * The inner rotated square of the two-element arrow (see
 * `tooltipArrowCompatClassName`). Positioned inside the clip window per the
 * rendered side (`in-data-[side=…]` reads the Base UI `data-side` stamp on
 * the window), with the border only on the two outer edges — exactly the
 * per-side widths the legacy Tamagui `PopperArrow` sets.
 */
export function tooltipArrowInnerCompatClassName(): string {
  return cn(
    flexCompatClassName(TOOLTIP_ARROW_FRAME_DEFAULTS),
    'absolute rotate-45',
    'in-data-[side=top]:top-[-5px] in-data-[side=top]:left-[6px] in-data-[side=top]:border-r-[1px] in-data-[side=top]:border-b-[1px]',
    'in-data-[side=bottom]:top-[6px] in-data-[side=bottom]:left-[6px] in-data-[side=bottom]:border-t-[1px] in-data-[side=bottom]:border-l-[1px]',
    'in-data-[side=left]:top-[6px] in-data-[side=left]:left-[-5px] in-data-[side=left]:border-t-[1px] in-data-[side=left]:border-r-[1px]',
    'in-data-[side=right]:top-[6px] in-data-[side=right]:left-[6px] in-data-[side=right]:border-b-[1px] in-data-[side=right]:border-l-[1px]',
  )
}

/**
 * Map the Tamagui hover-timing pair (`delay` + `restMs`) onto the Base UI
 * trigger timing (`delay` / `closeDelay`). Legacy semantics: floating-ui
 * opens after the pointer RESTS `restMs` when `delay.open` is 0, else after
 * `delay.open`; closes after `delay.close`. Base UI has a single fixed open
 * delay, so `restMs` stands in for a zero open delay (ledgered).
 */
export function mapTooltipDelay({ delay, restMs }: { delay: TooltipCompatDelay; restMs: number }): {
  openDelayMs: number
  closeDelayMs: number
} {
  const openDelay = typeof delay === 'number' ? delay : (delay.open ?? 0)
  const closeDelay = typeof delay === 'number' ? delay : (delay.close ?? 0)
  return {
    openDelayMs: openDelay > 0 ? openDelay : restMs,
    closeDelayMs: closeDelay,
  }
}
