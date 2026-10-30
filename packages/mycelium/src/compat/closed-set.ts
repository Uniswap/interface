import { DISPLAY_CLASS } from '../flex-compat/flex-style-classes'
/**
 * The closed, deterministic compat class set (INFRA-3217) — ENUMERATION SIDE.
 *
 * Tailwind only emits a utility its static scanner has seen, and the compat
 * compilers build classNames at render time — so this module enumerates every
 * class they may emit, from the SAME token maps / enum tables the compilers
 * read. The enumeration is written to `packages/mycelium/compat-classes.gen.txt`
 * (`src/scripts/generate-compat-classes.ts`) and registered as a Tailwind
 * `@source` from `packages/mycelium/tailwind.css`. This module runs only at
 * generation/test time; the runtime membership set is the generated
 * `family-classes.generated.ts` consumed by `closed-set-runtime.ts` (nothing
 * here ships as client JS).
 *
 * Two tiers, per the INFRA-3217 round-2 ruling ("go var-lane; do not pay the
 * enumeration bill"):
 *
 *  - BASE tier: per-value enumeration of the token/enum/ladder vocabulary
 *    (the families below), unprefixed. Base-tier values in this set keep
 *    their exact classes; values outside it ride the base var-indirection
 *    twins. This tier's cascade behavior is settled and byte-stable.
 *
 *  - VARIANT tiers: NO per-value enumeration. Every value under a reachable
 *    variant prefix — token or runtime-computed — rides a safelisted
 *    var-indirection twin (`media-md¦hover¦gap-⟦var(--cEh-gap)⟧`, encoded per
 *    `emitted-classes.ts` so the scanners cannot lift it) reading an
 *    inline custom property that is set unconditionally and only consumed
 *    under the variant. The safelist for variants is the twin matrix
 *    (utility-twin × variant-prefix, `inline-style.ts`): finite by
 *    construction, ~126 KB gzip measured vs ~254 KB for the retired
 *    per-value × variant enumeration, zero coverage gap.
 *
 * NOT enumerable, deliberately: named group variants (`$group-<name>-*`)
 * whose name is outside `REGISTERED_GROUP_NAMES` (`group.ts`, INFRA-3481) —
 * name-parameterized, so a static twin prefix exists only for registered
 * names. Base-pool values ride the inline lane; unregistered named-group-pool
 * values hit the dev throw (production keep-and-warn). This is the one
 * documented openness.
 */
import { FONT_DEFINITIONS, THEME_COLOR_TOKENS, VARIANT_METRICS } from '../text-compat/theme-tokens.generated'
import { FONT_WEIGHT_TOKEN } from '../text-compat/tokens'
import {
  SINGLE_LINE_ELLIPSIS,
  TEXT_DECORATION_CLASS,
  TEXT_TRANSFORM_CLASS,
  WHITE_SPACE_CLASS,
} from '../text-compat/typography-classes'
import { ENTER_EXIT_PRESET_CLASSES, ENTER_PRESET_CLASSES, EXIT_PRESET_CLASSES } from './animations'
import { TEXT_ALIGN_CLASS } from './inherited-text-classes'
import { REACHABLE_VARIANT_PREFIXES, varIndirectionClasses } from './inline-style'
import {
  ALIGN_ITEMS_CLASS,
  ALIGN_SELF_CLASS,
  colorClasses,
  DIRECTION_CLASS,
  JUSTIFY_CLASS,
  outlineColorClasses,
  POSITION_CLASS,
  RESET_CLASSES,
  WRAP_CLASS,
} from './style-classes'
import { POINTER_EVENTS_BOX_CLASSES } from './style-props'
import { COLOR_TOKEN_CLASS, RADIUS_TOKEN_PX, SPACE_TOKEN_PX, THEMED_COLOR_TOKEN_CLASSES } from './tokens'

// ── Static value ladders ───────────────────────────────────────────────
// Non-token numeric surfaces the compat prop contract commonly styles with.
// These are part of the closed-set DEFINITION (extend here + regenerate when
// a new value is needed); values outside a ladder follow the standard rule:
// base pool → inline var twin (variant pools always ride twins).

/**
 * Border widths (px). The legacy API takes Spore space tokens as well as plain
 * numbers (`borderWidthPx` resolves both), so the ladder must cover the
 * token-reached values (0/1/2/8) alongside the literals; 0.5 is the hairline
 * the legacy dropdowns use. Pinned by closed-set.test.ts against the in-use
 * value sweep — extend both together.
 */
export const BORDER_WIDTH_PX = [0, 0.25, 0.5, 1, 1.3, 1.5, 1.6, 2, 3, 8] as const

/** Opacity in 0.05 steps plus the legacy activeOpacity default (0.75 is on-grid). */
export const OPACITY_LADDER = Array.from({ length: 21 }, (_, i) => Number((i * 0.05).toFixed(2)))

/** Press/hover scale values (`pressStyle: { scale }` / `scaleTo`); 0.98 is the styled-options default. */
export const SCALE_LADDER = [0.7, 0.9, 0.95, 0.96, 0.97, 0.98, 0.99, 1, 1.02, 1.05, 1.1] as const

/** `numberOfLines` clamp values with real usage headroom. */
export const LINE_CLAMP_LADDER = [1, 2, 3, 4, 5] as const

/** flexGrow / flexShrink numeric values (`flex={n}` compiles to `grow-[n]`). */
export const FLEX_GROW_SHRINK_LADDER = [0, 1, 2, 3] as const

/** Focus-ring outline geometry (the styled-options ring is width 1 / offset 1). */
const OUTLINE_LENGTHS_PX = [0, 1, 2] as const

/** Enumerable pass-through strings the compilers emit fixed forms for. */
const MARGIN_SPECIALS = ['auto'] as const
const INSET_SPECIALS = ['auto', '100%'] as const
const SIZE_SPECIALS = ['auto', '100%', 'max-content', 'min-content', 'fit-content'] as const

/**
 * Long-tail props with closed value domains, enumerated as
 * `[css-prop:value]` arbitrary properties. Everything else in
 * `LONG_TAIL_STYLE_PROPS` has an unbounded value domain (see module docs).
 */
const INTERACTION_LONG_TAIL: Record<string, readonly string[]> = {
  cursor: ['pointer', 'default', 'auto', 'text', 'not-allowed', 'grab'],
  'pointer-events': ['none', 'auto'],
  'user-select': ['none', 'text', 'auto'],
}

const ENUMERABLE_LONG_TAIL: Record<string, readonly string[]> = {
  'border-style': ['solid', 'dashed', 'dotted', 'none'],
  'box-sizing': ['border-box', 'content-box'],
  'backface-visibility': ['visible', 'hidden'],
  isolation: ['isolate', 'auto'],
  float: ['left', 'right', 'none'],
  'object-fit': ['contain', 'cover', 'fill', 'none', 'scale-down'],
  'overflow-wrap': ['normal', 'break-word', 'anywhere'],
  'overflow-x': ['visible', 'hidden', 'scroll', 'auto'],
  'overflow-y': ['visible', 'hidden', 'scroll', 'auto'],
  'overscroll-behavior': ['auto', 'contain', 'none'],
  'overscroll-behavior-x': ['auto', 'contain', 'none'],
  'overscroll-behavior-y': ['auto', 'contain', 'none'],
  'text-wrap': ['wrap', 'nowrap', 'balance', 'pretty'],
  'scrollbar-width': ['auto', 'thin', 'none'],
  // The shorthand's multi-part values (`underline dotted`) have an open
  // domain and ride the base var twin; these singles cover the call sites.
  'text-decoration': ['none', 'underline', 'line-through'],
  'touch-action': ['auto', 'none', 'manipulation', 'pan-x', 'pan-y'],
  'transform-style': ['flat', 'preserve-3d'],
  direction: ['ltr', 'rtl'],
  'vertical-align': ['middle', 'top', 'bottom', 'baseline', 'text-top', 'text-bottom'],
  'box-shadow': ['none'],
  transition: ['none'],
}

// ── Family enumeration (base tier) ─────────────────────────────────────

function pxValues(map: Readonly<Record<string, number>>): number[] {
  return [...new Set(Object.values(map))].sort((a, b) => a - b)
}

function cross(prefixes: readonly string[], values: readonly (string | number)[]): string[] {
  return prefixes.flatMap((prefix) =>
    values.map((value) => `${prefix}-[${typeof value === 'number' ? `${value}px` : value}]`),
  )
}

const MARGIN_PREFIXES = ['m', 'mx', 'my', 'mt', 'mb', 'ml', 'mr'] as const
const PADDING_PREFIXES = ['p', 'px', 'py', 'pt', 'pb', 'pl', 'pr'] as const
const GAP_PREFIXES = ['gap', 'gap-x', 'gap-y'] as const
const INSET_PREFIXES = ['top', 'right', 'bottom', 'left'] as const
const SIZE_PREFIXES = ['w', 'h', 'min-w', 'min-h', 'max-w', 'max-h'] as const
const BORDER_PREFIXES = ['border', 'border-t', 'border-b', 'border-l', 'border-r'] as const

const COLOR_TOKENS: readonly string[] = [...Object.keys(COLOR_TOKEN_CLASS), ...Object.keys(THEMED_COLOR_TOKEN_CLASSES)]

/**
 * `bg-`/`border-` semantic + themed color utilities, via the compiler's own
 * `colorClasses`. The themed pairs' `dark:`-prefixed sibling classes are part
 * of the BASE vocabulary (the base pool emits both classes of a pair).
 */
function flexColorClasses(): string[] {
  const classes: string[] = []
  for (const prefix of ['bg', 'border'] as const) {
    // The raw CSS keyword the legacy call sites pass as a string compiles to
    // `${prefix}-[transparent]` through the same function.
    for (const value of [...COLOR_TOKENS, 'transparent']) {
      for (const cls of colorClasses(prefix, value)) {
        if (typeof cls === 'string') {
          classes.push(cls)
        }
      }
    }
  }
  return classes
}

/** `[outline-color:…]` forms, via the compiler's own `outlineColorClasses`. */
function outlineColorFamilyClasses(): string[] {
  return COLOR_TOKENS.flatMap((token) => outlineColorClasses(token))
}

function textMetricClasses(): string[] {
  const sizes = new Set<number>()
  const lineHeights = new Set<number>()
  const weights = new Set<number>(Object.values(FONT_WEIGHT_TOKEN))
  const families = new Set<string>()
  for (const metrics of Object.values(VARIANT_METRICS)) {
    sizes.add(metrics.fontSize)
    lineHeights.add(metrics.lineHeight)
    weights.add(metrics.fontWeight)
    families.add(metrics.family)
  }
  for (const font of Object.values(FONT_DEFINITIONS)) {
    families.add(font.family)
    for (const size of Object.values(font.sizes)) {
      sizes.add(size)
    }
    for (const lineHeight of Object.values(font.lineHeights)) {
      lineHeights.add(lineHeight)
    }
  }
  return [
    ...[...sizes].map((size) => `text-[${size}px]`),
    ...[...lineHeights].map((lineHeight) => `[line-height:${lineHeight}px]`),
    ...[...weights].map((weight) => `[font-weight:${weight}]`),
    ...[...families].map((family) => `[font-family:var(--stext-font-${family})]`),
  ]
}

/** TextCompat display always compiles to an arbitrary property (one tailwind-merge group). */
const TEXT_DISPLAY_VALUES = [
  'inherit',
  'none',
  'inline',
  'block',
  'contents',
  'flex',
  'inline-flex',
  'grid',
  'inline-grid',
  'unset',
] as const

function buildFamilies(): string[][] {
  const spacePx = pxValues(SPACE_TOKEN_PX)
  const radiusPx = pxValues(RADIUS_TOKEN_PX)
  const enumMaps = [
    DIRECTION_CLASS,
    ALIGN_ITEMS_CLASS,
    ALIGN_SELF_CLASS,
    JUSTIFY_CLASS,
    WRAP_CLASS,
    POSITION_CLASS,
    DISPLAY_CLASS,
    TEXT_ALIGN_CLASS,
    TEXT_TRANSFORM_CLASS,
    WHITE_SPACE_CLASS,
  ]
  return [
    // Layout + text enum utilities (incl. the variant shorthands' outputs and the frame resets).
    [
      ...enumMaps.flatMap((map) => Object.values(map)),
      '[display:inherit]',
      ...TEXT_DISPLAY_VALUES.map((value) => `[display:${value}]`),
      '[display:-webkit-box]',
      'grow',
      'shrink',
      'shrink-0',
      'w-max',
      'basis-auto',
      'italic',
      'not-italic',
      'text-ellipsis',
      'text-clip',
      '[text-overflow:unset]',
      'overflow-visible',
      'overflow-hidden',
      'overflow-clip',
      'overflow-scroll',
      'overflow-auto',
      '[overflow:unset]',
      ...SINGLE_LINE_ELLIPSIS,
      '[-webkit-box-orient:vertical]',
      ...LINE_CLAMP_LADDER.map((lines) => `[-webkit-line-clamp:${lines}]`),
      ...RESET_CLASSES.split(' '),
      'flex',
      'box-border',
      'm-0',
      '[word-wrap:break-word]',
      // The curated Text wordBreak union; 'unset' rides the word-break var
      // twin (registered in ARBITRARY_VAR_PROPS / VARIANT_TWIN_PROPS).
      '[word-break:normal]',
      '[word-break:break-all]',
      '[word-break:keep-all]',
      '[word-break:break-word]',
    ],
    // Text decoration (link hover underline and friends).
    Object.values(TEXT_DECORATION_CLASS),
    // Spacing / gap / inset / sizing / flex-basis (token px + enumerable specials).
    cross(MARGIN_PREFIXES, [...spacePx, ...MARGIN_SPECIALS]),
    cross(PADDING_PREFIXES, spacePx),
    cross(GAP_PREFIXES, spacePx),
    cross(INSET_PREFIXES, [...spacePx, ...INSET_SPECIALS]),
    cross(SIZE_PREFIXES, [...spacePx, ...SIZE_SPECIALS]),
    cross(['basis'], [...spacePx, 'auto', '100%']),
    FLEX_GROW_SHRINK_LADDER.flatMap((n) => [`grow-[${n}]`, `shrink-[${n}]`]),
    // Radius.
    radiusPx.map((px) => `rounded-[${px}px]`),
    // Border widths.
    cross(
      BORDER_PREFIXES,
      BORDER_WIDTH_PX.map((px) => `${px}px`),
    ),
    // Semantic + themed colors.
    flexColorClasses(),
    // TextCompat pinned color vars.
    THEME_COLOR_TOKENS.map((token) => `[color:var(--stext-${token})]`),
    // Typography metrics (variant type ramp + font tokens).
    textMetricClasses(),
    // Opacity ladder (press/hover dims compile these in the BASE pool too).
    OPACITY_LADDER.map((opacity) => `opacity-[${opacity}]`),
    // Press/focus scale transforms (styled-options press scale, focus ring pair).
    [
      ...SCALE_LADDER.map((scale) => `[transform:scale(${scale})]`),
      '[transform:scaleX(0.98)_scaleY(0.98)]',
      '[transform:scaleX(1)_scaleY(1)]',
    ],
    // Focus-ring outline surfaces.
    [
      ...OUTLINE_LENGTHS_PX.map((px) => `[outline-width:${px}px]`),
      ...OUTLINE_LENGTHS_PX.map((px) => `[outline-offset:${px}px]`),
      '[outline-style:solid]',
      '[outline-style:none]',
      ...outlineColorFamilyClasses(),
    ],
    // Interaction long-tail specials (cursor/pointer-events/user-select).
    Object.entries(INTERACTION_LONG_TAIL).flatMap(([prop, values]) => values.map((value) => `[${prop}:${value}]`)),
    // The RN-only pointerEvents polyfill pair (box-none/box-only, INFRA-3490),
    // via the compiler's own table: element rule + `>*` children rule.
    Object.values(POINTER_EVENTS_BOX_CLASSES).flat(),
    // Other enumerable long-tail values (closed value domains only).
    Object.entries(ENUMERABLE_LONG_TAIL).flatMap(([prop, values]) => values.map((value) => `[${prop}:${value}]`)),
    // Animation presets (fixed classes, variant-complete by definition).
    [
      ...Object.values(ENTER_PRESET_CLASSES),
      ...Object.values(EXIT_PRESET_CLASSES),
      ...Object.values(ENTER_EXIT_PRESET_CLASSES),
    ].flatMap((preset) => preset.split(' ')),
  ]
}

// ── Set assembly (generator/test side) ─────────────────────────────────

/**
 * The base-tier family vocabulary — the contents of the generated runtime
 * membership list (`family-classes.generated.ts`). Sorted and unique.
 */
export function compatFamilyClassEntries(): string[] {
  const set = new Set<string>()
  for (const family of buildFamilies()) {
    for (const cls of family) {
      set.add(cls)
    }
  }
  // Plain lexicographic sort: deterministic across platforms/locales.
  return [...set].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
}

/**
 * The var-indirection twin matrix: every twin utility under the base tier
 * and under every reachable variant prefix (`inline-style.ts`).
 */
export function compatTwinClassEntries(): string[] {
  return ['', ...REACHABLE_VARIANT_PREFIXES].flatMap((prefix) => varIndirectionClasses(prefix))
}
