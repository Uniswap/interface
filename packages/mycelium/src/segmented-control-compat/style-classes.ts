/**
 * Class tables + pure helpers for the SegmentedControl native rebuild
 * (INFRA-2966). Every value is transcribed 1:1 from the legacy Tamagui
 * component (packages/ui/src/components/SegmentedControl/SegmentedControl.tsx)
 * — this file is a pixel-parity target, not a redesign. Sizes/gaps map onto
 * Tailwind's 4px spacing scale, radii onto the shared @universe/tailwind
 * `--radius-*` tokens, colors onto the shared semantic tokens.
 */
import { cn } from '../cn'
import type { ColorTokens } from '../compat/color-tokens'
import { colorClasses } from '../compat/style-classes'
import { GAP_CLASS_BY_TOKEN, type SegmentedControlGapToken } from './tokens'
import type { SegmentedControlSize } from './types'

/**
 * Legacy TOGGLE_PADDING: 4px container padding on all sides. Applied as the
 * container's `p-1` utility (Tailwind 4px scale × 1) in
 * CONTAINER_BASE_CLASSES — the two must stay in lockstep because
 * getIndicatorTransform subtracts this constant from option rects measured
 * inside that padding (cross-checked in style-classes.test.ts).
 */
export const TOGGLE_PADDING = 4

/**
 * Legacy root frame: the "unstyled" `<Tabs>` wrapper still allocates a 1px
 * border on every side. Tamagui's SizableStack maps `unstyled: true` to
 * `bordered: false`, but the `bordered` function variant coerces any
 * non-number to 1 (`borderWidth: typeof val === 'number' ? val : 1`,
 * `borderColor: '$borderColor'`), and this app's themes set $borderColor to
 * transparent — so the legacy control's layout box is the painted pill plus
 * an invisible 1px frame (2px wider/taller, pill inset 1px from the top-left).
 *
 * Reproduced as a deterministic inline RN style — the same resolved values
 * Tamagui's `bordered` variant inlines (borderWidth 1 + transparent
 * borderColor) — instead of `border border-transparent` classes: border
 * classes resolve through uniwind's build-time class map, and on a class-map
 * miss the runtime silently drops the color and falls back to #000000 for any
 * borderStyle without a borderColor, painting a visible 1pt black ring on
 * device (INFRA-2966 QA). An inline style cannot miss, so the frame is
 * layout-only and never painted.
 */
export const ROOT_FRAME_STYLE = { borderWidth: 1, borderColor: 'transparent' } as const

// Legacy OptionsSelector: row flex, centered items, overflow hidden,
// transparent bg, p: TOGGLE_PADDING (p-1 = 4px — must equal TOGGLE_PADDING,
// see its doc comment).
const CONTAINER_BASE_CLASSES = 'flex-row items-center overflow-hidden bg-transparent p-1'

// Legacy size variants: minHeight / gap ($spacing4=4, $spacing6=6, $gap8=8,
// $gap12=12) / borderRadius ($roundedFull, $rounded16/20/24). CONS-2311
// (#37109) changed the legacy presets from fixed `height` to `minHeight` so
// the row grows to fit its tallest option — mirrored here. Note the side
// effect on `large` when outlined: its content column (36px option + 2×4px
// padding + 2×1px border = 46px) exceeds the 44px minimum that the old fixed
// height used to clamp, so current legacy renders the outlined large row at
// 46px (+2px vs. pre-CONS-2311); every other preset's minimum already
// accounts for the border and is unchanged.
const CONTAINER_SIZE_CLASSES: Record<SegmentedControlSize, string> = {
  xsmall: 'min-h-[30px] gap-1 rounded-full',
  small: 'min-h-[30px] gap-1.5 rounded-16',
  smallThumbnail: 'min-h-[34px] gap-1.5 rounded-16',
  default: 'min-h-[34px] gap-2 rounded-20',
  large: 'min-h-[44px] gap-3 rounded-24',
  largeThumbnail: 'min-h-[42px] gap-3 rounded-24',
}

export function containerClasses({
  size,
  outlined,
  fullWidth,
  gap,
}: {
  size: SegmentedControlSize
  outlined: boolean
  fullWidth?: boolean
  gap?: SegmentedControlGapToken
}): string {
  return cn(
    CONTAINER_BASE_CLASSES,
    CONTAINER_SIZE_CLASSES[size],
    // Legacy outlined variant: borderColor $surface3 / borderWidth $spacing1 (1px), else 0.
    outlined ? 'border border-surface3' : 'border-0',
    fullWidth && 'w-full',
    // Legacy passes `gap` through as an override of the size preset's gap.
    gap !== undefined && GAP_CLASS_BY_TOKEN[gap],
  )
}

// Legacy OptionButton: row flex, centered content, transparent bg, $roundedFull.
const OPTION_BASE_CLASSES = 'flex-row items-center justify-center bg-transparent rounded-full'

// Legacy size variants: minHeight ($spacing20/24/32/36) / py ($spacing2 or
// $padding8) / px (8, $padding6, $gap4, $padding8, $padding12). CONS-2311
// (#37109) changed the legacy presets from fixed `height` to `minHeight` so
// an option grows to fit content taller than the preset (e.g. wrapped
// translated labels) — mirrored here.
const OPTION_SIZE_CLASSES: Record<SegmentedControlSize, string> = {
  xsmall: 'min-h-5 py-0.5 px-2',
  small: 'min-h-5 py-0.5 px-1.5',
  smallThumbnail: 'min-h-6 py-0.5 px-1',
  default: 'min-h-6 py-0.5 px-2',
  large: 'min-h-9 py-2 px-3',
  largeThumbnail: 'min-h-8 py-2 px-2',
}

export function optionClasses({
  size,
  fullWidth,
  variableOptionWidths,
}: {
  size: SegmentedControlSize
  fullWidth?: boolean
  variableOptionWidths?: boolean
}): string {
  return cn(
    OPTION_BASE_CLASSES,
    OPTION_SIZE_CLASSES[size],
    fullWidth && 'flex-1',
    // Legacy variableOptionWidths variant: flexGrow 1 / flexShrink 1 /
    // flexBasis auto — each option sized to content instead of an equal
    // split. The callsite gates it on fullWidth, mirroring the legacy
    // OptionButton prop pair.
    variableOptionWidths && 'grow shrink basis-auto',
  )
}

/**
 * Option label typography for the web leg — the legacy
 * `<Text variant="buttonLabel3|4">` web metrics, byte-equal to what
 * TextCompat emits for the same variants (`VARIANT_METRICS` in
 * text-compat/theme-tokens.generated.ts: 14/16.1/535 large, 12/13.8/535
 * otherwise, Basel medium via the text-compat.css font stack vars), plus the
 * legacy `userSelect: 'none'`. Static literals so Tailwind's scanner emits
 * them; the style-classes test pins them against the generated variant
 * table. The native leg renders the same ramp via inline metrics instead
 * (see typography.ts — no native type-ramp utilities exist).
 */
export const LABEL_CLASSES_LARGE =
  '[font-family:var(--stext-font-medium)] text-[14px] [line-height:16.1px] [font-weight:535] select-none'
export const LABEL_CLASSES_SMALL =
  '[font-family:var(--stext-font-medium)] text-[12px] [line-height:13.8px] [font-weight:535] select-none'

/**
 * Legacy getOptionTextColor, expressed as semantic text-color utilities:
 * disabled → active ? $neutral2 : $neutral3; active or hovered → $neutral1;
 * else $neutral2.
 */
export function getOptionTextColorClass({
  active,
  hovered,
  disabled = false,
}: {
  active: boolean
  hovered: boolean
  disabled?: boolean
}): string {
  if (disabled) {
    return active ? 'text-neutral2' : 'text-neutral3'
  }
  if (active || hovered) {
    return 'text-neutral1'
  }
  return 'text-neutral2'
}

/**
 * Legacy TabsRovingIndicator fill: $surface3, $surface3Hovered on hover,
 * $roundedFull. The legacy styled config declares a `disabled: $surface2`
 * variant but the callsite never passes `disabled` to the indicator, so the
 * rendered control never shows it — reproduced as-is (no disabled branch).
 *
 * Dark mode pins the resting fill to #ffffff1e — 30/255-alpha white, the
 * quantized equivalent of legacy's rgba(255,255,255,0.12) $surface3 —
 * chosen so the fill composites over the dark surface1 backdrop as rendered
 * (#131314) to exactly rgb(47,47,48) = #2F2F30, the band the INFRA-2966
 * exit test pins byte-for-byte against legacy captures (per Charlie's
 * direction): round(30 + (225/255)·(19,19,20)) = (47,47,48). The pill is an
 * absolutely-positioned overlay ABOVE the selected option's label (zIndex
 * 10, structural twin of the legacy indicator), so the fill MUST stay
 * translucent for the white label to show through — pinning the flattened
 * solid itself (the previous dark:bg-[#2F2F30]) painted an opaque cover
 * that blanked the selected label on device in dark mode. Plain
 * bg-surface3 (#ffffff1f, 31/255) is one quantization step too opaque: it
 * flattens to rgb(48,48,49), a byte off the pinned band. Resolved through
 * uniwind's real Metro pipeline and pinned (fill translucency, #2F2F30
 * band, white glyph show-through) in apps/mobile
 * segmented-control-resolved-dark-styles.test.ts. Remove the `dark:`
 * override (falling back to plain bg-surface3) when the legacy Tamagui
 * control retires. Light mode already flattens to the same bytes as
 * bg-surface3 (rgb(236,236,236)), so it stays on the token.
 */
export function indicatorPillClasses({ hovered, color }: { hovered: boolean; color?: ColorTokens }): string {
  if (color) {
    return cn('h-full w-full rounded-full', colorClasses('bg', color))
  }
  return cn('h-full w-full rounded-full', hovered ? 'bg-surface3-hovered' : 'bg-surface3 dark:bg-[#ffffff1e]')
}

/**
 * Legacy indicator placement (native / isMobileApp branch):
 *   x = activeAt.x - TOGGLE_PADDING + (large ? 3.17 : 2.5)
 *   y = activeAt.y - TOGGLE_PADDING + (large ? 0 : -1.5)
 * The historical 2.5px/-1.5px optical adjustments are tuned for the smaller
 * sizes; on `large` the -1.5px lift leaves the indicator visibly closer to the
 * top than the bottom, and 3.17px (measured) centers the indicator's outer
 * gutters exactly. (Comment carried over from the legacy component.)
 */
export function getIndicatorTransform({ x, y, large }: { x: number; y: number; large: boolean }): {
  translateX: number
  translateY: number
} {
  const activeIndicatorXAdjustment = large ? 3.17 : 2.5
  const activeIndicatorYAdjustment = large ? 0 : -1.5
  return {
    translateX: x - TOGGLE_PADDING + activeIndicatorXAdjustment,
    translateY: y - TOGGLE_PADDING + activeIndicatorYAdjustment,
  }
}
