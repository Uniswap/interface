/**
 * The popover-compat class compiler: the popup frame defaults mirror the
 * Tamagui `PopperContentFrame` styled variants (`unstyled: false` →
 * `size: '$true'` = 8px padding + 0 radius, `backgroundColor: '$background'`,
 * `alignItems: 'center'`; `$background` resolves to `surface1` in both spore
 * themes), layered under the call site's own Popover.Content style props via
 * the shared Flex compat compiler (tailwind-merge semantics — caller wins).
 * Enter/exit motion is expressed as Base UI starting/ending-style transitions
 * mirroring the legacy ±10px fade (see the exclusions ledger for timing).
 */
import { cn } from '../cn'
import { flexCompatClassName } from '../flex-compat/compile'
import type { FlexCompatProps } from '../flex-compat/props'
import type { AdaptiveWebPopoverContentCompatProps, PopoverCompatPlacement } from './props'

const POPUP_FRAME_DEFAULTS: FlexCompatProps = {
  alignItems: 'center',
  p: 8,
  borderRadius: 0,
  backgroundColor: '$surface1',
}

const NON_STYLE_KEYS = [
  'children',
  'isOpen',
  'isSheet',
  'adaptWhen',
  'placement',
  'webBottomSheetProps',
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
  'forceMount',
  'forceUnmount',
  'freezeContentsWhenHidden',
  // ThemeableStack styled() variant shorthands: accepted-inert (ledgered
  // "Styled variant shorthands"), never compiled into utilities.
  'bordered',
  'circular',
  'hoverTheme',
  'pressTheme',
  'focusTheme',
  'elevate',
  'elevation',
  'transparent',
  'padded',
  'radiused',
  'fullscreen',
  // The wired FocusScope/Dismissable surface (destructured by the content,
  // listed here so direct compiler calls stay safe).
  'onOpenAutoFocus',
  'onCloseAutoFocus',
  'disableFocusScope',
  'onEscapeKeyDown',
  'onPointerDownOutside',
  'onFocusOutside',
  'onInteractOutside',
  'onFocusCapture',
  'onBlurCapture',
] as const

function styleProps(props: Partial<AdaptiveWebPopoverContentCompatProps>): FlexCompatProps {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (!(NON_STYLE_KEYS as readonly string[]).includes(key)) {
      out[key] = value
    }
  }
  return out as FlexCompatProps
}

/**
 * Legacy enter/exit: opacity 0 with y ±10 — from below when placed above the
 * trigger, from above otherwise. Expressed as Base UI `data-starting-style` /
 * `data-ending-style` transition states; timing is the fixed compat
 * approximation of the Tamagui `quick` driver config (ledgered).
 *
 * Every class string below is a FULL literal — never assembled via template
 * literals — so Tailwind's static extraction sees the candidates wherever
 * this source (or a generated class manifest) is scanned. The parity suite
 * compiles them through the real Tailwind engine and fails if any stops
 * emitting CSS (`popover-classes.test.ts`).
 */
const MOTION_BASE_CLASSES =
  'transition-[transform,opacity] duration-150 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0'
/** Placed above the trigger: animate from below (legacy y: +10). */
const MOTION_FROM_BELOW_CLASSES = 'data-starting-style:translate-y-[10px] data-ending-style:translate-y-[10px]'
/** Placed below the trigger or default: animate from above (legacy y: -10). */
const MOTION_FROM_ABOVE_CLASSES = 'data-starting-style:translate-y-[-10px] data-ending-style:translate-y-[-10px]'

function motionClasses(placement?: PopoverCompatPlacement): string {
  const isAboveTrigger = placement?.startsWith('top') ?? false
  return cn(MOTION_BASE_CLASSES, isAboveTrigger ? MOTION_FROM_BELOW_CLASSES : MOTION_FROM_ABOVE_CLASSES)
}

/** Compile the popup frame className for the given Popover.Content-style props. */
export function adaptiveWebPopoverContentCompatClassName(props: Partial<AdaptiveWebPopoverContentCompatProps>): string {
  return cn(
    flexCompatClassName({ ...POPUP_FRAME_DEFAULTS, ...styleProps(props) }),
    motionClasses(props.placement),
    'outline-none',
  )
}
