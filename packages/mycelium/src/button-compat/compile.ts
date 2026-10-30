/**
 * ButtonCompat's pure className compiler (INFRA-3230).
 *
 * Extracted out of the render for two reasons:
 *
 *  - the native parity harness types `NativeParitySuiteConfig.className` as
 *    `(props: P) => string`, and ButtonCompat had no such function — its class
 *    logic lived inline in `ButtonCompat.tsx`'s render;
 *  - `ButtonCompat.tsx` sat at the 500-line oxlint `max-lines` cap.
 *
 * Everything here is pure and platform-neutral (no `react`, no
 * `react-native`, no DOM), so both legs and the harness share one source of
 * truth for the class surface.
 *
 * WEB vs NATIVE. The web selectors emit the interaction scopes as Tailwind
 * variant prefixes (`hover:` / `active:` / `focus-visible:` /
 * `group-hover/sbtn:`). Native cannot: uniwind 1.7.0's CSS processor
 * recognizes only `:active`, `:focus`, `:disabled`, `:dir()`, themes and
 * `data-*`, and a class whose rule matches none of those is dropped in
 * silence (the resolver's class-map miss is a bare `continue`). So the native
 * selectors take the interaction state as a boolean and inline the chosen
 * scope's classes unprefixed — see `./variantEmphasisHash`.
 *
 * The web output is byte-frozen by `web-class-pin.test.tsx`: ButtonCompat's
 * parity proof is 2,912 computed-style cell-pairs from
 * `labs/workbench/scripts/verify-button-parity.mts`, and any change to the
 * emitted string invalidates it.
 */
import { cva } from 'class-variance-authority'
import { getMaybeHexOrRgbColor } from '../button-frame-compat/custom-color'
import { cn } from '../cn'
import { groupMarkerClasses } from '../compat/group'
import type { CommonStyleClassOptions } from '../compat/style-classes'
import type { ButtonCompatDimensionProps } from './dimensions'
import { buttonCompatNativeDimensions } from './native-dimensions'
import { NATIVE_TEXT_SIZE, NATIVE_TEXT_SIZE_NO_LEADING } from './native-size-tables'
import type { ScopedCell } from './variantEmphasisHash'
import {
  FRAME_SCOPE_PREFIXES,
  FRAME_VARIANT_EMPHASIS,
  joinScopes,
  TEXT_SCOPE_PREFIXES,
  TEXT_VARIANT_EMPHASIS,
  variantEmphasisClass,
} from './variantEmphasisHash'
import { buttonCompatDimensionClasses } from './web-dimensions'

export { FRAME_SCOPE_PREFIXES, TEXT_SCOPE_PREFIXES, variantEmphasisClass }
export type { ScopedCell }

export type ButtonVariant = 'default' | 'branded' | 'critical' | 'warning'
export type ButtonEmphasis = 'primary' | 'secondary' | 'tertiary' | 'text-only'
export type ButtonSize = 'xxsmall' | 'xsmall' | 'small' | 'medium' | 'large'
export type ButtonFocusScaling = 'default' | 'equal' | 'equal:smaller-button' | 'more-x'
export type ButtonIconPosition = 'before' | 'after'

/**
 * The subset of the Button surface that decides classes, shared by both legs.
 * The dimension slice (INFRA-3283) lives in `./dimensions`.
 */
export interface ButtonCompatStyleProps extends ButtonCompatDimensionProps {
  size?: ButtonSize
  variant?: ButtonVariant
  emphasis?: ButtonEmphasis
  fill?: boolean
  focusScaling?: ButtonFocusScaling
  iconPosition?: ButtonIconPosition
  loading?: boolean
  disabled?: boolean
  /** Keeps the button interactive while showing the disabled styling. */
  onDisabledPress?: unknown
  /**
   * The CUSTOM-BACKGROUND half: concrete hex/rgb only. A theme token rides
   * `./dimensions`' colour lane instead — the web leg splits the prop on
   * `getMaybeHexOrRgbColor`, and the frame gate below re-applies that test.
   */
  backgroundColor?: string
  /**
   * Caller-visible group anchor (INFRA-3550): `true` renders the `group`
   * marker, a name renders `group/<name>` — what descendants' `$group-*`
   * pools target. Distinct from the INTERNAL `group/sbtn` pool, which stays
   * private to the variant/emphasis cells. Web-only: the marker's `group-*`
   * variants don't resolve natively (the native leg dev-warns the drop).
   */
  group?: string | boolean
  className?: string
}

/** Live interaction state, tracked in React state on native (uniwind drops `hover:`). */
export interface ButtonInteractionState {
  hovered?: boolean
  pressed?: boolean
}

/* ---------------------------------- frame ---------------------------------- */

// padding/radius/gap from CustomButtonFrame size variants ($spacing/$rounded
// tokens). Hoisted out of the cva config so the native frame can reuse the
// same table without the web-only scoped classes around it.
const SIZE_CLASSES: Record<ButtonSize, string> = {
  xxsmall: 'gap-1 rounded-12 p-1.5',
  xsmall: 'gap-1 rounded-12 px-3 py-2',
  small: 'gap-2 rounded-12 px-3 py-2',
  medium: 'gap-2 rounded-16 px-4 py-3',
  large: 'gap-3 rounded-20 px-5 py-4',
}

const ICON_POSITION_CLASSES: Record<ButtonIconPosition, string> = {
  before: 'flex-row',
  after: 'flex-row-reverse',
}

// Focus-scale presets transcribed from the legacy CustomButtonFrame
const FOCUS_SCALING_CLASSES: Record<ButtonFocusScaling, string> = {
  default: 'focus-visible:scale-x-[0.98] focus-visible:scale-y-[0.905]',
  equal: 'focus-visible:scale-x-[0.98] focus-visible:scale-y-[0.98]',
  'equal:smaller-button': 'focus-visible:scale-x-[0.93] focus-visible:scale-y-[0.93]',
  'more-x': 'focus-visible:scale-x-[0.905] focus-visible:scale-y-[0.98]',
}

/*
 * The SUPPORTED prop pools, derived from the implementation tables above rather
 * than hand-written, so they cannot drift from what the compiler actually
 * handles. The native parity suite asserts each equals the corresponding
 * `packages/ui` legacy pool, so a divergence FAILS instead of silently
 * shrinking that suite's matrix (INFRA-3241).
 */
export const BUTTON_SIZES: string[] = Object.keys(SIZE_CLASSES)
export const BUTTON_ICON_POSITIONS: string[] = Object.keys(ICON_POSITION_CLASSES)
export const BUTTON_FOCUS_SCALINGS: string[] = Object.keys(FOCUS_SCALING_CLASSES)
export const BUTTON_VARIANTS: string[] = Object.keys(FRAME_VARIANT_EMPHASIS)
export const BUTTON_EMPHASES: string[] = Object.keys(FRAME_VARIANT_EMPHASIS.default)

// Legacy: animation 'fast' (100ms cubic-bezier(0.17,0.67,0.45,1)), animateOnly transform;
// pressStyle scale 0.98; focusVisible outline 1px solid offset 2.
const frame = cva(
  [
    // display:flex (not inline-flex), position:relative, min-w/h 0: the legacy
    // frame is a react-native-web view — these are its computed defaults, verified
    // head-to-head by labs/workbench/scripts/verify-button-parity.mts.
    'group/sbtn relative box-border flex min-h-0 min-w-0 cursor-pointer items-center justify-center',
    'border border-solid border-transparent bg-transparent select-none',
    '[transition:transform_100ms_cubic-bezier(0.17,0.67,0.45,1),filter_100ms_cubic-bezier(0.17,0.67,0.45,1)]',
    'active:scale-[0.98]',
    'focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-solid',
  ],
  {
    variants: {
      size: SIZE_CLASSES,
      iconPosition: ICON_POSITION_CLASSES,
      fill: {
        true: 'flex-1 basis-0 self-stretch',
        // RN views default to flex-shrink: 0 (fill's flex-1 sets shrink 1 on both sides)
        false: 'shrink-0',
      },
      focusScaling: FOCUS_SCALING_CLASSES,
    },
    defaultVariants: {
      size: 'medium',
      iconPosition: 'before',
      fill: true,
      focusScaling: 'default',
    },
  },
)

// Legacy isDisabled variant: bg $surface2 replaces ALL variant styling (tertiary loses its border).
// cursor-default applies to EVERY disabled button, including the onDisabledPress
// (interactive-while-disabled) case — an intentional deviation from legacy, which
// keeps cursor: pointer there (CustomButtonFrame.web.tsx isDisabled variant returns
// {} when onDisabledPress is set). Design (INFRA-2955): a disabled-looking button
// must not advertise a pointer, even if it still fires events on click.
const DISABLED_FRAME = 'bg-surface2 cursor-default'
const DISABLED_BLOCKED_FRAME = 'pointer-events-none'

// Legacy custom-bg hover/press/focus apply getHoverCssFilter(differenceFrom1: 0.25).
const CUSTOM_BG_FRAME =
  'hover:brightness-125 active:brightness-125 focus-visible:brightness-125 focus-visible:outline-(color:--sbtn-custom-outline)'

/** `getIsButtonDisabled`: loading also puts the button in the disabled UI state. */
export function isButtonDisabled(props: Pick<ButtonCompatStyleProps, 'disabled' | 'loading'>): boolean {
  return Boolean(props.disabled) || Boolean(props.loading)
}

/** Disabled UI, but still dispatching events (legacy `onDisabledPress`). */
export function isInteractiveWhileDisabled(props: ButtonCompatStyleProps): boolean {
  return isButtonDisabled(props) && Boolean(props.onDisabledPress)
}

function frameStateClasses(props: ButtonCompatStyleProps): string {
  if (isButtonDisabled(props)) {
    return cn(DISABLED_FRAME, !isInteractiveWhileDisabled(props) && DISABLED_BLOCKED_FRAME)
  }
  // Only concrete hex/rgb replaces the variant cell (the legacy gate); a theme
  // token layers a `bg-*` class over the cell, keeping its borders and scopes.
  if (getMaybeHexOrRgbColor(props.backgroundColor)) {
    return CUSTOM_BG_FRAME
  }
  return joinScopes(frameCell(props), FRAME_SCOPE_PREFIXES)
}

function frameCell(props: ButtonCompatStyleProps): ScopedCell {
  return variantEmphasisClass({
    map: FRAME_VARIANT_EMPHASIS,
    variant: props.variant ?? 'default',
    emphasis: props.emphasis ?? 'primary',
  })
}

/**
 * The WEB frame class string — exactly what `ButtonCompat.tsx` puts on its
 * `<button>`. Pinned byte-for-byte by `web-class-pin.test.tsx`.
 *
 * The dimension props (INFRA-3283) are deliberately NOT compiled here: on web
 * they must go through `./dimensions`' emission lane, whose closed-set check
 * can swap an out-of-set value for its var-indirection twin — a plain class
 * string cannot carry the twin's inline custom property. The web leg feeds the
 * emission's classes in through `className` (ahead of the caller's own), so
 * this function's output for a dimensionless call stays byte-identical.
 */
export function buttonCompatFrameClassName(props: ButtonCompatStyleProps): string {
  const { size, iconPosition, fill, focusScaling } = props
  return cn(
    frame({ size, iconPosition, fill, focusScaling }),
    frameStateClasses(props),
    groupMarkerClasses(props.group),
    props.className,
  )
}

/* ----------------------------------- text ---------------------------------- */

const DISABLED_TEXT = 'text-neutral2'

// Pinned buttonFont scale AS WEB RESOLVES IT (fonts.ts: fontSize f, lineHeight
// l * 1.15 with the two bases picked per size independently — see the NATIVE
// tables below; `adjustedSize` is a no-op on web):
//   xxsmall 12/13.8 · xsmall 12/16.1 · small 14/16.1 · medium 16/20.7 · large 18/20.7
// The @universe/tailwind text-button-* tokens drift from these (e.g. button-1 is
// 18/24), so the values stay pinned as arbitrary utilities. Font weight 535 =
// --font-weight-medium. WEB ONLY: byte-pinned via `web-class-pin.test.tsx`.
const TEXT_SIZE: Record<ButtonSize, string> = {
  xxsmall: 'text-[12px] leading-[13.8px]',
  xsmall: 'text-[12px] leading-[16.1px]',
  small: 'text-[14px] leading-[16.1px]',
  medium: 'text-[16px] leading-[20.7px]',
  large: 'text-[18px] leading-[20.7px]',
}

const TEXT_SIZE_NO_LEADING: Record<ButtonSize, string> = {
  xxsmall: 'text-[12px]',
  xsmall: 'text-[12px]',
  small: 'text-[14px]',
  medium: 'text-[16px]',
  large: 'text-[18px]',
}

/**
 * Test-only re-exports of the web text ramp above. Otherwise module-private
 * (byte-pinned via rendered DOM by `web-class-pin.test.tsx`), so without
 * these `native-size-tables.test.ts` could only compare the CJK column
 * against a second hand-pinned literal instead of the real values — see
 * that file's "CJK column equals the web ramp by construction" test.
 */
export const __testOnlyTextSize: Record<ButtonSize, string> = TEXT_SIZE
export const __testOnlyTextSizeNoLeading: Record<ButtonSize, string> = TEXT_SIZE_NO_LEADING

// Icon/spinner box = button font line-height for the size (useIconSizes).
// WEB ONLY, like TEXT_SIZE: byte-pinned via `web-class-pin.test.tsx`.
const ICON_SIZE: Record<ButtonSize, string> = {
  xxsmall: '[&_svg]:size-[13.8px]',
  xsmall: '[&_svg]:size-[16.1px]',
  small: '[&_svg]:size-[16.1px]',
  medium: '[&_svg]:size-[20.7px]',
  large: '[&_svg]:size-[20.7px]',
}

/**
 * The web icon box in numbers — same `useIconSizes` derivation as `ICON_SIZE`'s
 * `[&_svg]:` classes, but cloned directly onto mycelium glyphs, whose
 * inline-style size default beats the descendant classes. Those classes
 * still apply to unmarked children (raw svg).
 */
export const ICON_SIZE_PX: Record<ButtonSize, number> = {
  xxsmall: 13.8,
  xsmall: 16.1,
  small: 16.1,
  medium: 20.7,
  large: 20.7,
}

/** The web spinner box (`ButtonCompat.web.tsx` puts it on the inline `<svg>`) — same values as `ICON_SIZE_PX`. */
export const SPINNER_SIZE: Record<ButtonSize, number> = ICON_SIZE_PX

/*
 * ─── The NATIVE buttonFont scale ───────────────────────────────────────────
 *
 * In ./native-size-tables (INFRA-3297): legacy's `adjustedSize` skips its +1px
 * bump under zh/ja device locales, so the native scale is two value columns
 * gated on mycelium's drift-guarded `needsSmallFont` copy at module init —
 * the web tables above stay a single, byte-pinned column (web's check is
 * constant). Re-exported so this module remains the single import surface the
 * legs and the parity suites read.
 */
export { NATIVE_ICON_SIZE_PX, NATIVE_SPINNER_SIZE } from './native-size-tables'

/**
 * The circle-spinner glyph, transcribed from the web leg's inline `<svg>`
 * (`./ButtonCompat.web.tsx` ButtonSpinner): a full-circle track at 10% opacity
 * plus a quarter-arc, both 3-wide with round caps, in a 24x24 viewBox scaled to
 * `SPINNER_SIZE`. Lives here beside that size table because the native leg has
 * to rebuild the glyph as `react-native-svg` elements — `currentColor` and CSS
 * inheritance do not cross to native. The web leg keeps its literals so its
 * byte-pinned DOM is untouched — `web-class-pin.test.tsx` reads every value
 * back out of the rendered web markup so the two cannot drift.
 */
export const SPINNER_GLYPH = {
  viewBox: '0 0 24 24',
  strokeWidth: '3',
  trackOpacity: '0.1',
  trackPath:
    'M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3Z',
  arcPath: 'M21 12C21 7.02944 16.9706 3 12 3',
} as const

const TEXT_BASE =
  // font-family via arbitrary property: tailwind-merge 3.x misclassifies
  // font-(family-name:...) into the font-weight group and drops font-medium
  'text-center font-medium whitespace-nowrap [font-family:var(--sbtn-font-button)] [transition:color_100ms_cubic-bezier(0.17,0.67,0.45,1)]'

const ICON_BASE = 'inline-flex shrink-0 items-center justify-center [&_svg]:shrink-0'

const SPINNER_BASE = 'inline-flex shrink-0 items-center justify-center'

/** What the label/icon/spinner read off the parent Button (the legacy styled context). */
export interface ButtonContentClassProps {
  variant: ButtonVariant
  emphasis: ButtonEmphasis
  size: ButtonSize
  isDisabled: boolean
  /** Set when a custom backgroundColor is in play — overrides variant/emphasis text color. */
  customTextClass?: string
}

function textCell(ctx: ButtonContentClassProps): ScopedCell {
  return variantEmphasisClass({ map: TEXT_VARIANT_EMPHASIS, variant: ctx.variant, emphasis: ctx.emphasis })
}

/** The web color classes for the label/icon/spinner, hover scope included. */
export function buttonCompatColorClassName(ctx: ButtonContentClassProps): string {
  if (ctx.isDisabled) {
    return DISABLED_TEXT
  }
  return ctx.customTextClass ?? joinScopes(textCell(ctx), TEXT_SCOPE_PREFIXES)
}

export function buttonCompatTextClassName(
  ctx: ButtonContentClassProps & { lineHeightDisabled?: boolean; className?: string },
): string {
  const sizeClass = ctx.lineHeightDisabled ? TEXT_SIZE_NO_LEADING[ctx.size] : TEXT_SIZE[ctx.size]
  return cn(TEXT_BASE, sizeClass, buttonCompatColorClassName(ctx), ctx.className)
}

export function buttonCompatIconClassName(ctx: ButtonContentClassProps & { className?: string }): string {
  return cn(ICON_BASE, ICON_SIZE[ctx.size], buttonCompatColorClassName(ctx), ctx.className)
}

export function buttonCompatSpinnerClassName(ctx: ButtonContentClassProps): string {
  return cn(SPINNER_BASE, buttonCompatColorClassName(ctx))
}

/* --------------------------- custom backgroundColor -------------------------- */

// In ./contrast for the oxlint max-lines cap; re-exported so this module stays
// the single import surface the legs and the parity suites read.
export { getContrastTextClass } from './contrast'

/* ---------------------------------- native --------------------------------- */

/**
 * The NATIVE frame class string.
 *
 * Differences from the web string, all forced by the platform (each is pinned
 * in `packages/tailwind/src/parity/button/native-expectations.ts`):
 *
 *  - interaction scopes are inlined from `hovered`/`pressed` instead of
 *    emitted as `hover:` / `active:` prefixes, because uniwind drops `hover:`
 *    silently and the leg drives press through Reanimated, not `:active`;
 *  - `focusScaling` and the focus ring emit NOTHING. Not even rewritten to
 *    `focus:`: uniwind DOES recognize `:focus`, so `focus:outline-solid` would
 *    set `outlineStyle` while a `focus-visible:outline-*` color class still
 *    dropped — and uniwind then injects `#000000` for the missing
 *    `outlineColor`, painting a black focus ring (the INFRA-2966 QA
 *    black-border defect class);
 *  - `group/sbtn` is dropped: the label/icon read their color from
 *    `ButtonContext`, not from a group read-back;
 *  - the CSS `[transition:...]` is dropped — press is a Reanimated spring.
 *
 * `options` (INFRA-3750) lets the native leg swap in its drop-instead-of-throw
 * shadow-color policy for the shadowColor/shadowOpacity/shadowRadius lane (the
 * FlexCompat.native precedent — always-mounted chrome must degrade a shadow,
 * never crash on an unmapped token); the harness and any other caller default
 * to the throwing policy `buttonCompatDimensionClasses` already used.
 */
export function buttonCompatNativeFrameClassName(
  props: ButtonCompatStyleProps & ButtonInteractionState,
  options: CommonStyleClassOptions = {},
): string {
  const base = [
    'relative box-border flex min-h-0 min-w-0 cursor-pointer items-center justify-center',
    'border border-solid border-transparent bg-transparent',
    SIZE_CLASSES[props.size ?? 'medium'],
    ICON_POSITION_CLASSES[props.iconPosition ?? 'before'],
    (props.fill ?? true) ? 'flex-1 basis-0 self-stretch' : 'shrink-0',
    // RN's `flex: <positive>` implies `flexBasis: 0`; the CSS shorthand the web
    // lane mirrors leaves basis auto. Native-only, and only observable when
    // `fill` is false — its own `basis-0` above covers the default case.
    typeof props.flex === 'number' && props.flex > 0 ? 'basis-0' : undefined,
  ]
  // Dimension classes ride the className RAW (the FlexCompat.native doctrine):
  // token px values are in the generated NATIVE safelist, and the leg ALSO
  // declares the resolved values through `style` so an out-of-set value —
  // whose class uniwind's static scanner never saw — still applies on device.
  // They sit AFTER the variant/emphasis state classes so an explicit prop wins
  // a contested surface (borderColor vs a bordered cell) — the same
  // props-beat-variants precedence the web leg gets from its className-last
  // composition. The native pick is applied HERE (idempotent over the leg's
  // own picked props) so every caller — the leg, the parity harness — gets the
  // same value-level drops: a CSS-only borderColor keyword must never ride the
  // className, or it knocks the frame's border-transparent out of the merge
  // while resolving to nothing.
  return cn(
    base,
    nativeFrameStateClasses(props),
    buttonCompatDimensionClasses(buttonCompatNativeDimensions(props), options),
    props.className,
  )
}

function nativeFrameStateClasses(props: ButtonCompatStyleProps & ButtonInteractionState): string {
  if (isButtonDisabled(props)) {
    // `pointer-events-none` is deliberately NOT emitted: legacy native's
    // isDisabled sets `pointerEvents: 'box-none'`, and the real gate on native
    // is the Pressable's `disabled` prop.
    return DISABLED_FRAME
  }
  // Bare truthiness on purpose: the native leg paints every backgroundColor
  // through `style`, tokens included — the open INFRA-3230 escalation, pinned
  // in packages/tailwind/src/parity/button/native-expectations.ts.
  if (props.backgroundColor) {
    // The custom-bg brightness filter has no RN equivalent; the leg paints the
    // backgroundColor through `style` instead.
    return ''
  }
  const cell = frameCell(props)
  // press wins over hover, matching the joined web string's order (`active:`
  // after `hover:`, so equal-specificity press declarations land last).
  const scope = props.pressed ? cell.press : props.hovered ? cell.hover : ''
  return cn(cell.rest, scope)
}

/** Native color classes for the label/icon/spinner: hover scope inlined, no `group-hover:`. */
export function buttonCompatNativeColorClassName(
  ctx: ButtonContentClassProps & ButtonInteractionState & { className?: string },
): string {
  if (ctx.isDisabled) {
    return cn(DISABLED_TEXT, ctx.className)
  }
  if (ctx.customTextClass !== undefined) {
    return cn(ctx.customTextClass, ctx.className)
  }
  const cell = textCell(ctx)
  // Legacy's text table has no press entry, so a pressed label keeps its
  // at-rest color — `pressed` is threaded for shape uniformity, not color.
  return cn(cell.rest, ctx.hovered ? cell.hover : '', ctx.className)
}

/**
 * Native label classes: the pinned buttonFont size/leading plus the state color.
 *
 * `ctx.className` is appended exactly ONCE, and deliberately last (so a caller
 * class still wins the merge). It is stripped before the color selector runs,
 * because `buttonCompatNativeColorClassName` appends it too — passing the whole
 * ctx through emitted the caller's class TWICE. Measured: tailwind-merge
 * collapses the duplicate for any class it can put in a conflict group
 * (`my-2 my-2` -> `my-2`), which is why it went unseen, but an unrecognized
 * class survives both copies (`sbtn-spin sbtn-spin`, `group/item group/item`).
 */
export function buttonCompatNativeTextClassName(
  ctx: ButtonContentClassProps & ButtonInteractionState & { lineHeightDisabled?: boolean; className?: string },
): string {
  const sizeClass = ctx.lineHeightDisabled ? NATIVE_TEXT_SIZE_NO_LEADING[ctx.size] : NATIVE_TEXT_SIZE[ctx.size]
  return cn('text-center', sizeClass, buttonCompatNativeColorClassName({ ...ctx, className: undefined }), ctx.className)
}
