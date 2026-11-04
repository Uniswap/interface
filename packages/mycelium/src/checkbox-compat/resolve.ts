/**
 * Platform-neutral prop resolution for the checkbox compat pair: the six
 * derived pixel sizes, the legacy defaults, the inline-style lane, and the
 * `text` shape classification. Both legs import from here so neither can drift
 * (mycelium/CLAUDE.md:9 — runtime split fine, contract divergence not).
 *
 * Everything numeric that is props-driven lives HERE and rides an inline
 * `style`, never a computed class name: uniwind's oxide scanner is static and
 * the native runtime silently skips a class-map miss (INFRA-3217). The closed
 * domains (the three size tokens, the space tokens, the color tokens) select a
 * LITERAL class from a table in `./compile` instead.
 */
import { flattenCompatStyle } from '../compat/compose'
import { ICON_SIZE_TOKEN_PX, lookupToken } from '../compat/tokens'
import type {
  CheckboxCompatHoverStyle,
  CheckboxCompatSizeToken,
  CheckboxCompatStyleProp,
  CheckboxCompatVariant,
  LabeledCheckboxCompatProps,
} from './props'

/**
 * Legacy defaults, transcribed from the two component signatures.
 */
export const DEFAULT_CHECKBOX_SIZE: CheckboxCompatSizeToken = '$icon.20'
export const DEFAULT_CHECKBOX_VARIANT: CheckboxCompatVariant = 'default'
export const DEFAULT_CHECKBOX_POSITION = 'start' as const
export const DEFAULT_LABELED_GAP = '$spacing12' as const
export const DEFAULT_LABELED_PX = '$spacing4' as const

/** The six sizes legacy `getSizes` derives. */
export interface CheckboxSizes {
  /** `round(n * 1.3)` — the outer focus ring. */
  focusRing: number
  /** `n` — the checkbox button itself. */
  box: number
  /** `n - 4` — the checkmark glyph at rest. */
  glyphDefault: number
  /** `n - 2` — the checkmark glyph while pressed, and the indicator square. */
  glyphPressed: number
  /** `round(n * 0.2)` — the unselected hover dot. */
  hoverDot: number
  /** `round(n * 0.3)` — the unselected hover dot while pressed. */
  pressedDot: number
}

/**
 * Transcribed, not computed at render: the three tokens are a closed domain, so
 * the derived pixel sets are pinned as data. Each token resolves to its OWN
 * distinct set — no collapsing onto the 20px default and no near-neighbour
 * mapping (INFRA-3233 names this explicitly).
 */
export const CHECKBOX_SIZES_BY_TOKEN: Readonly<Record<CheckboxCompatSizeToken, CheckboxSizes>> = {
  // 16 → round(20.8)=21, 16, 12, 14, round(3.2)=3, round(4.8)=5
  '$icon.16': { focusRing: 21, box: 16, glyphDefault: 12, glyphPressed: 14, hoverDot: 3, pressedDot: 5 },
  // 18 → round(23.4)=23, 18, 14, 16, round(3.6)=4, round(5.4)=5
  '$icon.18': { focusRing: 23, box: 18, glyphDefault: 14, glyphPressed: 16, hoverDot: 4, pressedDot: 5 },
  // 20 → round(26)=26, 20, 16, 18, round(4)=4, round(6)=6
  '$icon.20': { focusRing: 26, box: 20, glyphDefault: 16, glyphPressed: 18, hoverDot: 4, pressedDot: 6 },
}

/** Legacy `getSizes` re-expressed for the drift test — the arithmetic, not the table. */
export function deriveCheckboxSizes(sizePx: number): CheckboxSizes {
  return {
    focusRing: Math.round(sizePx * 1.3),
    box: sizePx,
    glyphDefault: sizePx - 4,
    glyphPressed: sizePx - 2,
    hoverDot: Math.round(sizePx * 0.2),
    pressedDot: Math.round(sizePx * 0.3),
  }
}

/** Icon-size token → px, through the shared compat token map. */
export function checkboxSizePx(size: CheckboxCompatSizeToken): number {
  const px = lookupToken(ICON_SIZE_TOKEN_PX, size)
  if (px === undefined) {
    throw new Error(`CheckboxCompat: unknown icon size token "${size}"`)
  }
  return px
}

export function resolveCheckboxSizes(size: CheckboxCompatSizeToken = DEFAULT_CHECKBOX_SIZE): CheckboxSizes {
  // Through `lookupToken` so the unknown-token guard stays reachable: indexing the
  // total `Record<CheckboxCompatSizeToken, …>` directly types as never-undefined.
  const sizes = lookupToken(CHECKBOX_SIZES_BY_TOKEN, size)
  if (sizes === undefined) {
    throw new Error(`CheckboxCompat: unknown icon size token "${size}"`)
  }
  return sizes
}

/** The interaction state both legs track in React state (never a `hover:` class — dead on native). */
export interface CheckboxInteractionState {
  hovered: boolean
  focused: boolean
  pressed: boolean
}

export const CHECKBOX_AT_REST: CheckboxInteractionState = { hovered: false, focused: false, pressed: false }

/**
 * Legacy glyph sizing: the checkmark grows to
 * `CheckSizePressed` while pressed, otherwise `CheckSizeDefault`.
 */
export function checkGlyphPx(sizes: CheckboxSizes, pressed: boolean): number {
  return pressed ? sizes.glyphPressed : sizes.glyphDefault
}

/** Legacy dot sizing. */
export function hoverDotPx(sizes: CheckboxSizes, pressed: boolean): number {
  return pressed ? sizes.pressedDot : sizes.hoverDot
}

/**
 * The bordered-View checkmark geometry for the native leg: a box with only its
 * bottom and left edges drawn, rotated -45°. Derived from the glyph box so the
 * three size tokens each get their own proportional glyph.
 */
export interface CheckGlyphGeometry {
  width: number
  height: number
  marginTop: number
}

export function checkGlyphGeometry(glyphPx: number): CheckGlyphGeometry {
  return {
    // A checkmark's short leg is ~half its long leg; the rotated box's
    // width/height ratio reproduces that.
    width: Math.round(glyphPx * 0.6),
    height: Math.round(glyphPx * 0.32),
    // Optical lift: the rotated box's visual centre sits below its layout box.
    marginTop: -Math.round(glyphPx * 0.12),
  }
}

/** True when `checked`'s indicator should render (legacy renders the Indicator only when checked). */
export function shouldShowIndicator(checked: boolean): boolean {
  return checked
}

/**
 * Legacy shows the unselected hover dot only when NOT checked, hovered, and not
 * disabled.
 */
export function shouldShowHoverDot({
  checked,
  hovered,
  disabled,
}: {
  checked: boolean
  hovered: boolean
  disabled?: boolean
}): boolean {
  return !checked && hovered && !disabled
}

/** How `text` is rendered: legacy wraps a string, passes an element through. */
export type LabeledTextShape = 'absent' | 'string' | 'element'

export function labeledTextShape(text: LabeledCheckboxCompatProps['text']): LabeledTextShape {
  // One falsiness test, exactly like legacy's `{text && …}` gate:
  // covers undefined and the empty string, and still reads a runtime `null` from an
  // untyped call site as absent rather than as an element (`typeof null === 'object'`).
  if (!text) {
    return 'absent'
  }
  return typeof text === 'string' ? 'string' : 'element'
}

/**
 * Flatten a `StyleProp` to a single style object, with React Native
 * `StyleSheet.flatten` semantics: arrays flatten depth-first left→right with
 * later entries winning, and `false`/`null`/`undefined` entries are skipped.
 *
 * The single definition of what a `StyleProp` means for this pair. Every
 * array-admitting style prop goes through it on BOTH legs —
 * `LabeledCheckboxCompat`'s `containerStyle` and `CheckboxCompat`'s `style`,
 * the two props typed `CheckboxCompatStyleProp` — so the legs cannot drift.
 *
 * The walk itself is the core `flattenCompatStyle` — one shared
 * implementation. The copy into a fresh object keeps this pair's
 * contract: always an object (never `undefined` — the call sites spread or
 * pass it unconditionally), never the caller's own reference.
 *
 * Platform-neutral, so no web diagnostics in here: the WEB legs pass the
 * flattened result through `warnUnsupportedWebStyleKeys` at their call sites
 * (RN-only keys are perfectly valid on the native leg's flatten).
 */
export function flattenStyleProp(style: CheckboxCompatStyleProp): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  Object.assign(out, flattenCompatStyle(style))
  return out
}

/**
 * The inline-style lane for `hoverStyle`. Values pass through verbatim, exactly
 * as Tamagui forwarded them. A `$`-token VALUE throws instead of reaching the
 * style raw — the FlexCompat "unmappable tokens fail fast instead of guessing"
 * convention; no call site in the repo passes one.
 *
 * Both legs must call this UNCONDITIONALLY at render, never behind the
 * `hoverable && hovered` guard that gates its use: behind the guard a bad token
 * mounts cleanly and throws mid-interaction, on the first hover.
 */
export function resolveHoverStyle(hoverStyle: CheckboxCompatHoverStyle | undefined): Record<string, unknown> {
  if (hoverStyle === undefined) {
    return {}
  }
  const out: Record<string, unknown> = {}
  for (const [prop, value] of Object.entries(hoverStyle)) {
    if (typeof value === 'string' && value.startsWith('$')) {
      throw new Error(
        `LabeledCheckboxCompat: hoverStyle.${prop} = "${value}" — Spore tokens are not resolved in the hoverStyle ` +
          `inline lane. Pass a resolved value (INFRA-3233).`,
      )
    }
    if (value !== undefined) {
      out[prop] = value
    }
  }
  return out
}
