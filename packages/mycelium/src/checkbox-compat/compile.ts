/**
 * The literal class tables for the checkbox compat pair (INFRA-3233), used by
 * BOTH platform legs so the two can never drift.
 *
 * Every value here is a FULL LITERAL class string selected from a table by prop
 * value — never assembled at runtime. uniwind runs the same static
 * `@tailwindcss/oxide` scanner for native as Tailwind does for web and reduces
 * the result to a build-time class map that the native runtime SILENTLY skips
 * on a miss, so a computed class string is invisible to the scanner and
 * disappears without an error (INFRA-3217). `CHECKBOX_COMPAT_CLASS_UNIVERSE`
 * below enumerates the complete emittable set, so `compile.test.ts` can check
 * that every emitted class is a static literal.
 *
 * Native hazards this file is written against (all measured on uniwind 1.7.0):
 * - No `hover:` / `group-hover:` — they do not resolve on native. Hover is
 *   React state on both legs, which is also what legacy did
 *   (DOM mouse handlers) and what the shipped
 *   `SegmentedControl.native.tsx` does.
 * - No `md:` / `max-md:` / `media-*` — this component has no responsive
 *   behavior, so no breakpoint variant is emitted at all.
 * - No `shadow-short|medium|large` — they throw `RangeError` on native.
 * - Every border-WIDTH class ships with a border-COLOR class in the same
 *   string: `borderStyle` without `borderColor` makes uniwind inject
 *   `#000000` (the INFRA-2966 black-ring QA bug).
 *
 * Color mapping notes:
 * - Legacy's `default` variant accent is `$accent3`.
 *   `@universe/tailwind` makes `accent3` a deprecated ALIAS of `neutral1`
 *   (`css/variables.css:72` `--accent3: var(--neutral1)`) and — critically —
 *   the `accent3` utilities are **web-only, absent from `native.css`** by
 *   design (`native.css:20-21`, `src/types.ts:24-27`). So the tables use
 *   `neutral1` / `neutral1-hovered` directly: value-identical on web, and the
 *   only form that resolves on native. `bg-accent3` would be a silent native
 *   miss.
 */
import { cn } from '../cn'
import { lookupToken } from '../compat/tokens'
import type { CheckboxCompatSizeToken, CheckboxCompatVariant } from './props'

/* ------------------------------- size tables ------------------------------- */

/**
 * `round(n * 1.3)` — 21 / 23 / 26px. Explicit `h-`/`w-` rather than `size-`:
 * the shipped native class tables use the axis utilities
 * (`SegmentedControl.native.tsx` via `style-classes.ts`), and `size-*` has no
 * native precedent in this repo.
 */
export const FOCUS_RING_SIZE_CLASS_BY_TOKEN: Readonly<Record<CheckboxCompatSizeToken, string>> = {
  '$icon.16': 'h-[21px] w-[21px]',
  '$icon.18': 'h-[23px] w-[23px]',
  '$icon.20': 'h-[26px] w-[26px]',
}

/** `n` — 16 / 18 / 20px. Each token its own size (INFRA-3233: no collapsing onto 20). */
export const BOX_SIZE_CLASS_BY_TOKEN: Readonly<Record<CheckboxCompatSizeToken, string>> = {
  '$icon.16': 'h-[16px] w-[16px]',
  '$icon.18': 'h-[18px] w-[18px]',
  '$icon.20': 'h-[20px] w-[20px]',
}

/** `n - 2` — 14 / 16 / 18px, the legacy Indicator square. */
export const INDICATOR_SIZE_CLASS_BY_TOKEN: Readonly<Record<CheckboxCompatSizeToken, string>> = {
  '$icon.16': 'h-[14px] w-[14px]',
  '$icon.18': 'h-[16px] w-[16px]',
  '$icon.20': 'h-[18px] w-[18px]',
}

/* ------------------------------ color helpers ------------------------------ */

/**
 * Legacy `getAccentColor` as border-color classes:
 * `branded` → `$accent1`/`$accent1Hovered`, `default` → `$accent3`/
 * `$accent3Hovered` expressed through their `neutral1` aliases (see the file
 * header for why the alias, not `accent3`, is the correct form).
 */
const ACCENT_BORDER_CLASS: Readonly<Record<CheckboxCompatVariant, { rest: string; hovered: string }>> = {
  branded: { rest: 'border-accent1', hovered: 'border-accent1-hovered' },
  default: { rest: 'border-neutral1', hovered: 'border-neutral1-hovered' },
}

/** Background classes reachable as the accent. */
const ACCENT_BG_CLASS: Readonly<Record<CheckboxCompatVariant, { rest: string; hovered: string }>> = {
  branded: { rest: 'bg-accent1', hovered: 'bg-accent1-hovered' },
  default: { rest: 'bg-neutral1', hovered: 'bg-neutral1-hovered' },
}

function accentBorderClass(variant: CheckboxCompatVariant, hovered: boolean): string {
  const entry = ACCENT_BORDER_CLASS[variant]
  return hovered ? entry.hovered : entry.rest
}

function accentBgClass(variant: CheckboxCompatVariant, hovered: boolean): string {
  const entry = ACCENT_BG_CLASS[variant]
  return hovered ? entry.hovered : entry.rest
}

/* --------------------------------- space ---------------------------------- */

/**
 * Spore space tokens → gap/px/py utilities, mirroring the shipped native table
 * in `segmented-control-compat/tokens.ts`. Tailwind's spacing scale is 4px-based, so
 * every token pixel value maps 1:1 except `$spacing1` (1px), which has no scale
 * step and uses an arbitrary value. `resolve`/`compile` tests cross-check every
 * entry against `SPACE_TOKEN_PX`.
 */
export const GAP_CLASS_BY_TOKEN: Readonly<Record<string, string>> = {
  $none: 'gap-0',
  $true: 'gap-2',
  $spacing1: 'gap-[1px]',
  $spacing2: 'gap-0.5',
  $spacing4: 'gap-1',
  $spacing6: 'gap-1.5',
  $spacing8: 'gap-2',
  $spacing12: 'gap-3',
  $spacing16: 'gap-4',
  $spacing18: 'gap-4.5',
  $spacing20: 'gap-5',
  $spacing24: 'gap-6',
  $spacing28: 'gap-7',
  $spacing32: 'gap-8',
  $spacing36: 'gap-9',
  $spacing40: 'gap-10',
  $spacing48: 'gap-12',
  $spacing60: 'gap-15',
  $padding6: 'gap-1.5',
  $padding8: 'gap-2',
  $padding12: 'gap-3',
  $padding16: 'gap-4',
  $padding20: 'gap-5',
  $padding24: 'gap-6',
  $padding36: 'gap-9',
  $gap2: 'gap-0.5',
  $gap4: 'gap-1',
  $gap8: 'gap-2',
  $gap12: 'gap-3',
  $gap16: 'gap-4',
  $gap20: 'gap-5',
  $gap24: 'gap-6',
  $gap32: 'gap-8',
  $gap36: 'gap-9',
}

export const PX_CLASS_BY_TOKEN: Readonly<Record<string, string>> = {
  $none: 'px-0',
  $true: 'px-2',
  $spacing1: 'px-[1px]',
  $spacing2: 'px-0.5',
  $spacing4: 'px-1',
  $spacing6: 'px-1.5',
  $spacing8: 'px-2',
  $spacing12: 'px-3',
  $spacing16: 'px-4',
  $spacing18: 'px-4.5',
  $spacing20: 'px-5',
  $spacing24: 'px-6',
  $spacing28: 'px-7',
  $spacing32: 'px-8',
  $spacing36: 'px-9',
  $spacing40: 'px-10',
  $spacing48: 'px-12',
  $spacing60: 'px-15',
  $padding6: 'px-1.5',
  $padding8: 'px-2',
  $padding12: 'px-3',
  $padding16: 'px-4',
  $padding20: 'px-5',
  $padding24: 'px-6',
  $padding36: 'px-9',
  $gap2: 'px-0.5',
  $gap4: 'px-1',
  $gap8: 'px-2',
  $gap12: 'px-3',
  $gap16: 'px-4',
  $gap20: 'px-5',
  $gap24: 'px-6',
  $gap32: 'px-8',
  $gap36: 'px-9',
}

export const PY_CLASS_BY_TOKEN: Readonly<Record<string, string>> = {
  $none: 'py-0',
  $true: 'py-2',
  $spacing1: 'py-[1px]',
  $spacing2: 'py-0.5',
  $spacing4: 'py-1',
  $spacing6: 'py-1.5',
  $spacing8: 'py-2',
  $spacing12: 'py-3',
  $spacing16: 'py-4',
  $spacing18: 'py-4.5',
  $spacing20: 'py-5',
  $spacing24: 'py-6',
  $spacing28: 'py-7',
  $spacing32: 'py-8',
  $spacing36: 'py-9',
  $spacing40: 'py-10',
  $spacing48: 'py-12',
  $spacing60: 'py-15',
  $padding6: 'py-1.5',
  $padding8: 'py-2',
  $padding12: 'py-3',
  $padding16: 'py-4',
  $padding20: 'py-5',
  $padding24: 'py-6',
  $padding36: 'py-9',
  $gap2: 'py-0.5',
  $gap4: 'py-1',
  $gap8: 'py-2',
  $gap12: 'py-3',
  $gap16: 'py-4',
  $gap20: 'py-5',
  $gap24: 'py-6',
  $gap32: 'py-8',
  $gap36: 'py-9',
}

/** Space token → class, or `undefined` for an open-domain value (number/%/auto → inline lane). */
export function spaceClass(table: Readonly<Record<string, string>>, value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.startsWith('$')) {
    return undefined
  }
  const cls = lookupToken(table, value)
  if (cls === undefined) {
    throw new Error(`LabeledCheckboxCompat: unknown space token "${value}"`)
  }
  return cls
}

/* ------------------------------- class builders ----------------------------- */

export interface CheckboxFrameState {
  size: CheckboxCompatSizeToken
  variant: CheckboxCompatVariant
  checked: boolean
  disabled: boolean
  hovered: boolean
  focused: boolean
}

/**
 * Legacy outer focus ring: `$rounded6`, `$spacing1`
 * border, `round(n*1.3)` square, centered, and a border color from
 * `getFocusedRingColor` — transparent unless focused; `branded` +
 * selected → the accent, otherwise `$neutral3`.
 *
 * The transparent-unless-focused ring is exactly the shape
 * `SegmentedControl.native.tsx` moved to an inline style to dodge the uniwind
 * `#000000` injection. It stays on classes here instead, because mixing an
 * inline `borderColor` with a class one inverts on web (inline wins) and would
 * make the focused ring unreachable — and because the native emission gate
 * resolves all four of these border-color classes through the real uniwind
 * store in both themes, which is the check SegmentedControl did not have.
 */
// `relative`: the legacy ring is a react-native-web view, whose computed
// `position` is `relative`.
export const FOCUS_RING_BASE_CLASSES = 'relative flex flex-col items-center justify-center rounded-6 border'

export function checkboxFocusRingClassName(state: CheckboxFrameState): string {
  return cn(FOCUS_RING_BASE_CLASSES, FOCUS_RING_SIZE_CLASS_BY_TOKEN[state.size], focusRingBorderClass(state))
}

function focusRingBorderClass({ variant, focused, checked, hovered }: CheckboxFrameState): string {
  if (!focused) {
    return 'border-transparent'
  }
  if (variant === 'branded' && checked) {
    return accentBorderClass('branded', hovered)
  }
  return 'border-neutral3'
}

/**
 * Legacy checkbox button: unstyled frame,
 * `backgroundColor: transparent`, `$rounded4`, `$spacing2` (2px) border,
 * `cursor: pointer`, centered, `pointerEvents` gated on `disabled`, and a
 * border color of `disabled ? $neutral3 : checked ? accent : $neutral2`. The
 * legacy `hoverStyle` resolved to the SAME values as the base
 * border color, so hover only changes the accent through `getAccentColor` —
 * which is why hover is a state input here rather than a `hover:` variant.
 */
export const BOX_BASE_CLASSES =
  'relative flex flex-col items-center justify-center rounded-4 border-2 bg-transparent cursor-pointer'

/**
 * `border-2` ships in the SAME literal string as a border-color class in every
 * branch below — never a width without a color, which is what makes uniwind
 * inject `#000000` on native.
 *
 * A caller-supplied `borderColor` deliberately does NOT reach this function.
 * Legacy spreads `{...rest}` FIRST and then re-declares `borderColor`, so the derived value wins and the caller's
 * value is dead — see `CheckboxCompatProps.borderColor`.
 */
export function checkboxBoxClassName(state: CheckboxFrameState): string {
  return cn(
    BOX_BASE_CLASSES,
    BOX_SIZE_CLASS_BY_TOKEN[state.size],
    // Only the disabled form is emitted. Legacy derives
    // `pointerEvents = disabled ? 'none' : 'auto'` but Tamagui omits the
    // 'auto' default from the resolved style, so emitting `pointer-events-auto`
    // would be an extra declaration the legacy component never produces.
    state.disabled ? 'pointer-events-none' : undefined,
    boxBorderClass(state),
  )
}

function boxBorderClass({ disabled, checked, variant, hovered }: CheckboxFrameState): string {
  if (disabled) {
    return 'border-neutral3'
  }
  return checked ? accentBorderClass(variant, hovered) : 'border-neutral2'
}

/**
 * Legacy `Checkbox.Indicator`: a centered
 * `CheckSizePressed` square filled with `disabled ? $neutral3 : accent`.
 */
export const INDICATOR_BASE_CLASSES = 'flex flex-col items-center justify-center'

export function checkboxIndicatorClassName(state: CheckboxFrameState): string {
  return cn(
    INDICATOR_BASE_CLASSES,
    INDICATOR_SIZE_CLASS_BY_TOKEN[state.size],
    state.disabled ? 'bg-neutral3' : accentBgClass(state.variant, state.hovered),
  )
}

/**
 * Legacy checkmark color: `disabled ? $neutral2 :
 * variant === 'branded' ? 'white' : $surface1`. The web leg feeds this to the
 * mycelium `Check` icon's `color` prop (the icon factory's inline-style
 * channel); the native leg paints the bordered-View glyph with the class form.
 */
export function checkGlyphColorToken(state: Pick<CheckboxFrameState, 'disabled' | 'variant'>): string {
  if (state.disabled) {
    return '$neutral2'
  }
  return state.variant === 'branded' ? 'white' : '$surface1'
}

/**
 * The native check glyph: a box with only its bottom and left edges drawn,
 * rotated -45°. Built when mycelium icons were DOM-only; since INFRA-3508
 * (`createIcon.native.tsx`) a real icon IS reachable from a native leg, so
 * redrawing this glyph with the `Check` icon is available follow-up work.
 * The 2px stroke is a single literal for all three sizes; legacy's SVG stroke
 * is proportional (`strokeWidth: 5` in a 48 viewBox ≈ 10% of the glyph), so
 * the smallest size renders a slightly heavier tick than legacy. Recorded as a
 * visual-fidelity tradeoff, not a silent difference.
 */
export const CHECK_GLYPH_BASE_CLASSES = 'border-b-2 border-l-2 -rotate-45'

export function checkGlyphClassName(state: Pick<CheckboxFrameState, 'disabled' | 'variant'>): string {
  if (state.disabled) {
    return cn(CHECK_GLYPH_BASE_CLASSES, 'border-neutral2')
  }
  return cn(CHECK_GLYPH_BASE_CLASSES, state.variant === 'branded' ? 'border-white' : 'border-surface1')
}

/**
 * Legacy unselected hover dot: an absolutely
 * positioned `$neutral2` circle. Its diameter is a proportional derivation of
 * the glyph box (`round(n*0.2)` / `round(n*0.3)`), so it rides the inline lane.
 */
export const HOVER_DOT_CLASSES = 'absolute rounded-full bg-neutral2'

/* --------------------------- labeled-checkbox row -------------------------- */

/** Legacy `TouchableArea` wrapper — unstyled, pressable. */
export const LABELED_CONTAINER_CLASSES = 'cursor-pointer'

/** Legacy `<Flex row alignItems="center" gap px py>`. */
export const LABELED_ROW_BASE_CLASSES = 'flex flex-row items-center'

export interface LabeledRowOptions {
  gap?: unknown
  px?: unknown
  py?: unknown
}

export function labeledRowClassName({ gap, px, py }: LabeledRowOptions): string {
  return cn(
    LABELED_ROW_BASE_CLASSES,
    spaceClass(GAP_CLASS_BY_TOKEN, gap),
    spaceClass(PX_CLASS_BY_TOKEN, px),
    spaceClass(PY_CLASS_BY_TOKEN, py),
  )
}

/** The inline lane for open-domain (numeric / `%` / `auto`) space values. */
export function labeledRowStyle({ gap, px, py }: LabeledRowOptions): Record<string, unknown> {
  const style: Record<string, unknown> = {}
  if (gap !== undefined && spaceClass(GAP_CLASS_BY_TOKEN, gap) === undefined) {
    style['gap'] = gap
  }
  if (px !== undefined && spaceClass(PX_CLASS_BY_TOKEN, px) === undefined) {
    style['paddingLeft'] = px
    style['paddingRight'] = px
  }
  if (py !== undefined && spaceClass(PY_CLASS_BY_TOKEN, py) === undefined) {
    style['paddingTop'] = py
    style['paddingBottom'] = py
  }
  return style
}

/** Legacy `<Flex grow shrink>` label wrapper. */
export const LABELED_TEXT_WRAPPER_CLASSES = 'flex flex-col grow shrink'

/**
 * Legacy string-`text` wrapping:
 * `<Text variant="subheading2">`, whose default color is `$neutral1`.
 *
 * The legacy `$short={{ variant: 'buttonLabel4' }}` height-media downgrade is
 * NOT reproduced: `$short` compiles to the `h-short:` custom variant declared
 * in `@universe/tailwind`'s `css/base.css`, and `native.css` imports only
 * `css/theme.css` — so `h-short:` does not exist in the native bundle and
 * would be a silent class-map miss there. Dropping it on both legs keeps the
 * two class universes identical; a web-only variant would make the legs
 * diverge and fail the native emission gate. Pinned as a known deviation.
 */
export const LABELED_TEXT_CLASSES = 'text-subheading-2 text-neutral1'

/* ----------------------------- the class universe -------------------------- */

function classesOf(...values: string[]): string[] {
  return values.flatMap((value) => value.split(/\s+/).filter(Boolean))
}

/**
 * The COMPLETE set of class names either component can ever emit. The parity
 * suites assert every entry resolves — through the real Tailwind engine for
 * web and the real uniwind store for native, in both themes — because a
 * class-map miss is otherwise silent (INFRA-3217).
 *
 * Kept as a derived-from-the-tables enumeration (data, not a computed class
 * string): the tables are the single source of truth, so a new table entry
 * cannot escape the gate.
 */
export const CHECKBOX_COMPAT_CLASS_UNIVERSE: readonly string[] = [
  ...new Set(
    classesOf(
      FOCUS_RING_BASE_CLASSES,
      BOX_BASE_CLASSES,
      INDICATOR_BASE_CLASSES,
      CHECK_GLYPH_BASE_CLASSES,
      HOVER_DOT_CLASSES,
      LABELED_CONTAINER_CLASSES,
      LABELED_ROW_BASE_CLASSES,
      LABELED_TEXT_WRAPPER_CLASSES,
      LABELED_TEXT_CLASSES,
      'pointer-events-none',
      'border-transparent',
      'border-neutral2',
      'border-neutral3',
      'bg-neutral3',
      ...Object.values(FOCUS_RING_SIZE_CLASS_BY_TOKEN),
      ...Object.values(BOX_SIZE_CLASS_BY_TOKEN),
      ...Object.values(INDICATOR_SIZE_CLASS_BY_TOKEN),
      ...Object.values(GAP_CLASS_BY_TOKEN),
      ...Object.values(PX_CLASS_BY_TOKEN),
      ...Object.values(PY_CLASS_BY_TOKEN),
      ...Object.values(ACCENT_BORDER_CLASS).flatMap((entry) => [entry.rest, entry.hovered]),
      ...Object.values(ACCENT_BG_CLASS).flatMap((entry) => [entry.rest, entry.hovered]),
      'border-white',
      'border-surface1',
    ),
  ),
].sort()
