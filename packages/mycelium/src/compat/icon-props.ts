/**
 * The icon binding of the compat style machinery (INFRA-3320): mycelium icons
 * accept the legacy `ui/src` icon styling surface first-class — a conversion
 * is a pure import swap. Two lanes, chosen per render:
 *
 *  - BASE lane (no `$`-pool props — ~99% of censused call sites): every
 *    supported style prop resolves through the compat token maps into INLINE
 *    STYLE (`applyIconCssLane`), the ticket's sanctioned direct style merge —
 *    no Tailwind classes. Preserves the channel invariant: props and defaults
 *    must beat container CSS like `[&_svg]:size-4`.
 *
 *  - POOL lane (`$group-hover` / `$group-item-hover` / `$xs` / `$sm`, plus
 *    untyped media/group keys): pools ride the shared orchestration
 *    (`composeCompatEmission` + the variant machinery) with `iconStyleClasses`
 *    as the compiler — like FlexCompat, including the INFRA-3217
 *    deterministic-emission contract (in-set classes or safelisted twins;
 *    named group pools inherit compose's dev-throw). Base values a pool
 *    overrides are HOISTED into the class channel for that render — inline
 *    style would beat the variant class unconditionally — scoped per
 *    overridden prop: everything else keeps the inline channel.
 *
 * `SUPPORTED_ICON_STYLE_PROPS` (derived from the runtime maps here) and the
 * `icon-prop-coverage.ts` rejected ledger partition the 41-prop census
 * universe exactly — pinned by `icon-prop-coverage.test.ts`.
 */
import type * as React from 'react'
// The display enum map is the Flex/View one — icons must not fork it (same cross-directory import as closed-set.ts).
import { flexDisplayClass } from '../flex-compat/flex-style-classes'
import { composeCompatEmission, type CompatEmission } from './compose'
import { iconColorOrLog } from './diagnostics'
import type { CompatProps, CompatStyleProps, DisplayValue, PositionValue } from './props'
import { arbitrary, commonStyleClasses, flexboxStyleClasses, sizeValue, type ClassList } from './style-classes'
import {
  ICON_SIZE_TOKEN_PX,
  lookupToken,
  SPACE_TOKEN_PX,
  type SporeColorToken,
  type SporeIconSizeToken,
  type SporeSpaceToken,
} from './tokens'

// ── Value types ────────────────────────────────────────────────────────

/** Legacy icon size surface: `$icon.N` token, raw px, or the `{ width, height }` object form. */
export type IconSize = SporeIconSizeToken | number | { width: number; height: number }
/** Legacy widened color union — tokens keep autocomplete, `(string & {})` keeps raw CSS compiling. */
export type IconColor = SporeColorToken | (string & {}) | null
/**
 * Margin/padding base values: `$spacing*` tokens, raw px numbers (negatives
 * included), and — unlike the Flex class lane — raw CSS strings (`"auto"`,
 * `"16px"`; census-live). Resolution is `sizeValue`: unknown `$` tokens throw.
 */
export type IconSpaceValue = SporeSpaceToken | number | (string & {})
/**
 * Pool-side margin/padding values, narrower than base (reviewed contract —
 * no censused pool uses raw CSS strings): tokens/numbers/`auto`/percentages.
 * Hoisted BASE values may still be any string (`iconStyleClasses` twins).
 */
export type IconPoolSpaceValue = SporeSpaceToken | number | 'auto' | `${number}%`
/** Sizing values: numbers are px, strings pass through (`'100%'`). */
export type IconSizeValue = number | (string & {})
export type IconAlignSelf = 'auto' | 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'unset'

/**
 * The icon style-object surface (the icon itself and its `$group-*` / media
 * pool objects): the census-derived SUPPORTED style surface minus the
 * SVG-channel props the factory resolves itself (`strokeWidth`,
 * `strokeLinecap`, `fill`, `fillOpacity`, `style`).
 */
export interface IconCompatStyleProps {
  size?: IconSize
  color?: IconColor
  // layout
  flexShrink?: number
  alignSelf?: IconAlignSelf
  display?: DisplayValue
  // spacing (the censused legacy shorthands/longhands only)
  ml?: IconSpaceValue
  mr?: IconSpaceValue
  mt?: IconSpaceValue
  mx?: IconSpaceValue
  margin?: IconSpaceValue
  marginEnd?: IconSpaceValue
  padding?: IconSpaceValue
  // sizing
  width?: IconSizeValue
  height?: IconSizeValue
  minWidth?: IconSizeValue
  maxWidth?: IconSizeValue
  // visuals / transforms / interaction
  opacity?: number
  rotate?: string
  transform?: string
  cursor?: React.CSSProperties['cursor']
  pointerEvents?: React.CSSProperties['pointerEvents']
  verticalAlign?: React.CSSProperties['verticalAlign']
  // positioning (INFRA-3320 rejected-ledger widening: the packages/wallet
  // ChooseNftModal.tsx absolutely-positioned close icon)
  position?: PositionValue
  left?: IconSpaceValue
}

/** The spacing props of the icon surface (shorthands + censused longhands). */
type IconSpaceProp = 'margin' | 'mx' | 'ml' | 'mr' | 'mt' | 'marginEnd' | 'padding'

/**
 * BASE-lane-only props: fully supported inline, excluded from the pool
 * surface — no deterministic-emission story. `marginEnd` has no spacing
 * utility and falls to the long tail, whose token lane INFRA-3339/#38916
 * owns (a `me-` utility here would collide with that PR's derived census);
 * `vertical-align` is not in `VARIANT_TWIN_PROPS`. Census: zero pooled uses.
 * Smuggled values fail closed at render; re-admission needs the emission
 * twin first (`icon-pool-surface.test.tsx` gates).
 */
export const ICON_BASE_LANE_ONLY_PROPS = ['marginEnd', 'verticalAlign'] as const satisfies readonly IconCssLaneProp[]
type IconBaseLaneOnlyProp = (typeof ICON_BASE_LANE_ONLY_PROPS)[number]

/**
 * The style object a pool accepts: the base surface minus the base-lane-only
 * props (pooling one is a compile error, not a runtime throw), with spacing
 * narrowed to `IconPoolSpaceValue` — the reviewed pool contract.
 */
export type IconCompatPoolStyleProps = Omit<IconCompatStyleProps, IconSpaceProp | IconBaseLaneOnlyProp> & {
  [K in Exclude<IconSpaceProp, IconBaseLaneOnlyProp>]?: IconPoolSpaceValue
}

/**
 * The censused pool props, typed first-class. Untyped sibling keys (`$md`,
 * `$group-press`) still resolve through the same machinery at runtime; only
 * these four are the pinned supported boundary.
 */
export interface IconCompatPoolProps {
  '$group-hover'?: IconCompatPoolStyleProps
  '$group-item-hover'?: IconCompatPoolStyleProps
  $xs?: IconCompatPoolStyleProps
  $sm?: IconCompatPoolStyleProps
}

// ── Token resolution (the factory's SVG channels) ──────────────────────

/**
 * Resolve a `$`-color token to its `@universe/tailwind` value. Non-token
 * strings pass through; a token outside every map LOGS AN ERROR and returns
 * `undefined`, meaning "emit no colour" so the icon inherits `currentColor`.
 * It used to throw. Resolution and the report both live in `./diagnostics`
 * `iconColorOrLog`, shared with the native leg. Never resolves raw.
 */
export function resolveIconColor(value: string): string | undefined {
  return value.startsWith('$') ? iconColorOrLog(value) : value
}

/** Resolve legacy `$icon.N` size tokens to px; numbers pass through; unknown strings throw. */
function resolveIconSizePx(value: number | string): number {
  if (typeof value === 'number') {
    return value
  }
  const px = lookupToken(ICON_SIZE_TOKEN_PX, value)
  if (px === undefined) {
    throw new Error(`mycelium icons: unknown icon size token "${value}"`)
  }
  return px
}

/** Legacy default size (`$icon.8`). */
export const DEFAULT_ICON_SIZE: SporeIconSizeToken = '$icon.8'

/** Per-axis px for any legacy `size` shape, incl. the `{ width, height }` object form. */
export function iconSizeAxes(value: IconSize): { width: number; height: number } {
  if (typeof value === 'object') {
    return { width: value.width, height: value.height }
  }
  const px = resolveIconSizePx(value)
  return { width: px, height: px }
}

/**
 * `strokeWidth` is a Tamagui space-token slot (census: `"$spacing1"`, `"$spacing2"`):
 * tokens resolve to px; numbers and non-token strings pass through as the SVG attribute value.
 */
export function resolveIconStrokeWidth(value: number | string): number | string {
  if (typeof value === 'number' || !value.startsWith('$')) {
    return value
  }
  const px = lookupToken(SPACE_TOKEN_PX, value)
  if (px === undefined) {
    throw new Error(`mycelium icons: unknown strokeWidth token "${value}"`)
  }
  return px
}

// ── The CSS lane (inline-style resolvers) ──────────────────────────────

/** Mutable inline-style draft the CSS-lane resolvers write into. */
export type IconInlineStyle = React.CSSProperties

type IconCssLaneProp = Exclude<keyof IconCompatStyleProps, 'size' | 'color'>

/**
 * The base-lane resolver per CSS prop — this map IS the runtime supported set
 * for the CSS lane (the mapped type keeps it exhaustive against
 * `IconCompatStyleProps`). Declaration order is application order, and CSS
 * shorthands reset their longhands, so the shorthands (`margin`, `mx`) are
 * declared BEFORE the longhands (`ml`/`mr`/`mt`/`marginEnd`) — the longhand
 * write lands last and wins, keeping `<Icon mt="$spacing8" margin={0} />` at
 * `margin-top: 8px` like legacy did. Same rule places `transform` after
 * `rotate`: an explicit `transform` string replaces the `rotate` shorthand
 * (Tamagui's rule). Exported for `icon-pool-surface.test.tsx`'s derived-set gates.
 */
export const ICON_CSS_LANE_RESOLVERS: {
  [K in IconCssLaneProp]-?: (value: NonNullable<IconCompatStyleProps[K]>, style: IconInlineStyle) => void
} = {
  flexShrink: (value, style) => {
    style.flexShrink = value
  },
  alignSelf: (value, style) => {
    style.alignSelf = value
  },
  display: (value, style) => {
    style.display = value
  },
  margin: (value, style) => {
    style.margin = sizeValue(value)
  },
  mx: (value, style) => {
    style.marginLeft = sizeValue(value)
    style.marginRight = sizeValue(value)
  },
  ml: (value, style) => {
    style.marginLeft = sizeValue(value)
  },
  mr: (value, style) => {
    style.marginRight = sizeValue(value)
  },
  mt: (value, style) => {
    style.marginTop = sizeValue(value)
  },
  marginEnd: (value, style) => {
    style.marginInlineEnd = sizeValue(value)
  },
  padding: (value, style) => {
    style.padding = sizeValue(value)
  },
  width: (value, style) => {
    style.width = sizeValue(value)
  },
  height: (value, style) => {
    style.height = sizeValue(value)
  },
  minWidth: (value, style) => {
    style.minWidth = sizeValue(value)
  },
  maxWidth: (value, style) => {
    style.maxWidth = sizeValue(value)
  },
  opacity: (value, style) => {
    style.opacity = value
  },
  cursor: (value, style) => {
    style.cursor = value
  },
  pointerEvents: (value, style) => {
    style.pointerEvents = value
  },
  verticalAlign: (value, style) => {
    style.verticalAlign = value
  },
  rotate: (value, style) => {
    style.transform = `rotate(${value})`
  },
  transform: (value, style) => {
    style.transform = value
  },
  position: (value, style) => {
    style.position = value
  },
  left: (value, style) => {
    style.left = sizeValue(value)
  },
}

/** Whether a JSX prop belongs to the icon CSS lane (the factory's partition predicate). */
export function isIconCssLaneProp(key: string): key is IconCssLaneProp {
  return Object.hasOwn(ICON_CSS_LANE_RESOLVERS, key)
}

/** Resolve CSS-lane props into the inline-style draft, in resolver-map order (JSX attribute order never matters). */
export function applyIconCssLane(props: IconCompatStyleProps, style: IconInlineStyle): void {
  for (const key of Object.keys(ICON_CSS_LANE_RESOLVERS) as IconCssLaneProp[]) {
    const value = props[key]
    if (value !== undefined) {
      ;(ICON_CSS_LANE_RESOLVERS[key] as (value: unknown, style: IconInlineStyle) => void)(value, style)
    }
  }
}

// ── The pool lane (class emission via the shared compat machinery) ─────

/** Spacing utility per icon space prop (`SPACING_UTILITIES` order: shorthands before longhands; `marginEnd` is base-lane-only). */
const ICON_SPACE_UTILITY = { margin: 'm', mx: 'mx', mt: 'mt', ml: 'ml', mr: 'mr', padding: 'p' } as const satisfies {
  [K in Exclude<IconSpaceProp, IconBaseLaneOnlyProp>]: string
}

/**
 * Compile one icon style object to classes — the pool lane's per-style-object
 * compiler. Spacing rides `sizeValue` (the inline lane's resolver), not the
 * shared `spacePx` pass: the BASE space type admits raw CSS strings
 * (`"16px"`, census-live) that `spacePx` throws on. Tokens/numbers compile
 * byte-identically (unknown `$` tokens still throw); raw strings land in the
 * arbitrary-value slot, where the emission keeps the in-set class or swaps
 * the safelisted var twin — ANY base value survives the margin-family hoist
 * yet still loses to the pooled override (round-6 emission-gate.test.ts cases).
 */
export function iconStyleClasses(style: IconCompatStyleProps): string[] {
  const cls: ClassList = []
  if (style.size !== undefined) {
    const axes = iconSizeAxes(style.size)
    cls.push(`w-[${axes.width}px]`, `h-[${axes.height}px]`)
  }
  if (style.color !== undefined && style.color !== null) {
    // `undefined` is the unmapped-token drop: emit no colour class at all, so
    // the icon inherits rather than carrying an invented one.
    const resolvedColor = resolveIconColor(style.color)
    if (resolvedColor !== undefined) {
      cls.push(`[color:${arbitrary(resolvedColor)}]`)
    }
  }
  const rest = { ...style }
  for (const prop of Object.keys(ICON_SPACE_UTILITY) as (keyof typeof ICON_SPACE_UTILITY)[]) {
    const value = rest[prop]
    if (value !== undefined) {
      cls.push(`${ICON_SPACE_UTILITY[prop]}-[${arbitrary(sizeValue(value))}]`)
      delete rest[prop]
    }
  }
  // The shared compilers cover the rest (sizing — later w/h beat the size
  // axes via tailwind-merge, matching the base lane's per-axis override —
  // opacity, transforms, the long tail). Base-lane-only props never get here
  // from typed code; smuggled values fail closed (token/out-of-set dev throw).
  cls.push(...flexboxStyleClasses(rest, flexDisplayClass), ...commonStyleClasses(rest as unknown as CompatStyleProps))
  return cls.filter((entry): entry is string => typeof entry === 'string' && entry !== '')
}

/**
 * The margin channel: one CSS family (`margin` resets every longhand),
 * hoisted as a group — see `composeIconPools`. `marginEnd` writes a margin
 * declaration but is deliberately absent (base-lane-only): the long tail
 * cannot express it in the class lane, so it keeps the inline channel; no
 * censused call site pools over it. `icon-pool-surface.test.tsx`'s derived-set
 * gate pins this (exported) list against the margin-writing resolvers;
 * `padding` has no longhands — per-key hoist covers it.
 */
export const MARGIN_FAMILY = ['margin', 'mx', 'ml', 'mr', 'mt'] as const satisfies readonly IconCssLaneProp[]

export interface IconPoolResolution {
  emission: CompatEmission
  /** The base lane surviving the hoist — what the factory still renders inline. */
  cssLane: IconCompatStyleProps
  /** The sizing channel (size/width/height) moved to the class lane this render. */
  sizingHoisted: boolean
  /** The color channel moved to the class lane this render. */
  colorHoisted: boolean
}

// One decision, not three copies: the hoist and the emission must agree, or the base leaves inline style for a class that never appears. NOT pure despite the shape: an unmapped colour reports through `iconColorOrLog` in here, and every pool entry compiles twice per render (once for this predicate, once for real in the emission) — the report is deduped per token, so the second compile costs no second log.
const compilesToClass = (style: IconCompatStyleProps): boolean => iconStyleClasses(style).length > 0
/** `hoverColor` compiles to a `hoverStyle` pseudo pool — the icon's own `:hover`, like legacy's web hover wrapper. */
function hoverColorPool(hoverColor: string | undefined): { hoverStyle: IconCompatStyleProps } | undefined {
  const pool = hoverColor === undefined ? undefined : { hoverStyle: { color: hoverColor } }
  return pool !== undefined && compilesToClass(pool.hoverStyle) ? pool : undefined
}

/**
 * Compile the pool props through the shared deterministic-emission engine.
 * Base props a pool overrides with a value that COMPILES TO A CLASS are
 * hoisted into the emission's base tier — inline style would always beat the variant
 * classes — and dropped from the returned `cssLane`, the surviving base lane
 * the factory renders inline (pure: the argument is never mutated). The
 * hoist trades the base lane's container-CSS invariant: hoisted values ride
 * the class channel, so container descendant rules (`[&_svg]:size-4`, one
 * extra type selector) beat them where inline style won — the cascade
 * position of every FlexCompat class (Flex has no inline lane): accepted
 * pool-lane semantics, pinned by the emission-gate cascade proofs (the
 * variant tier sorts after the whole base tier, so a pooled `margin` DOES
 * beat a hoisted base `mr` at equal specificity). Hoisting is
 * channel-grouped: pooled size/width/height hoists the whole sizing channel,
 * pooled rotate/transform the composed transform, a pooled margin-family
 * prop every base margin-family prop (one CSS channel — a base `mr` left
 * inline would beat a pooled `margin` reset), everything else per key.
 * Base-lane-only props never hoist from typed code: inline, always.
 */
export function composeIconPools({
  pools,
  cssLane,
  size,
  color,
  hoverColor,
  className,
}: {
  pools: Record<string, IconCompatStyleProps>
  cssLane: IconCompatStyleProps
  size: IconSize | undefined
  /** The base color, already defaulted (raw token or CSS string). */
  color: string
  /** The icon's own `:hover` color (raw token or CSS string), already null/empty-filtered by the factory. */
  hoverColor: string | undefined
  className: string | undefined
}): IconPoolResolution {
  // Hoist on what the compiler EMITS, not key presence: an `undefined` entry and an unmapped colour (logged, dropped) emit no class, and hoisting for either strands the base behind one that never appears.
  const pooled = new Set(
    Object.values(pools)
      .flatMap((poolStyle) => Object.entries(poolStyle))
      .filter(([key, value]) => compilesToClass({ [key]: value } as IconCompatStyleProps))
      .map(([key]) => key),
  )
  const hoverPool = hoverColorPool(hoverColor)

  const base: Record<string, unknown> = {}
  const sizingHoisted = pooled.has('size') || pooled.has('width') || pooled.has('height')
  if (sizingHoisted) {
    base['size'] = size ?? DEFAULT_ICON_SIZE
  }
  const colorHoisted = pooled.has('color') || hoverPool !== undefined
  if (colorHoisted) {
    base['color'] = compilesToClass({ color }) ? color : 'currentColor' // an unmapped token would trade the inline currentColor for no declaration at all
  }
  const transformPooled = pooled.has('rotate') || pooled.has('transform')
  const marginPooled = MARGIN_FAMILY.some((key) => pooled.has(key))
  const survivingLane: IconCompatStyleProps = { ...cssLane }
  for (const key of Object.keys(cssLane) as IconCssLaneProp[]) {
    const grouped =
      (sizingHoisted && (key === 'width' || key === 'height')) ||
      (transformPooled && (key === 'rotate' || key === 'transform')) ||
      (marginPooled && (MARGIN_FAMILY as readonly string[]).includes(key))
    if (pooled.has(key) || grouped) {
      base[key] = cssLane[key]
      delete survivingLane[key]
    }
  }

  const emission = composeCompatEmission<IconCompatStyleProps>({
    props: { ...base, ...hoverPool, ...pools, className } as CompatProps<IconCompatStyleProps>,
    baseClasses: '',
    styleClasses: iconStyleClasses,
  })
  return { emission, cssLane: survivingLane, sizingHoisted, colorHoisted }
}

// Rejected-prop runtime enforcement lives with the ledger (extracted for the
// max-lines lint) — re-exported so consumers are unchanged.
export { reportRejectedIconProp, resetRejectedIconPropWarnings } from './icon-prop-coverage'

// ── The pinned supported set ───────────────────────────────────────────

/**
 * Factory-channel props the factory resolves itself: SVG channels, the plain
 * `style` passthrough, `hoverColor` (class emission), and `testID` (INFRA-2962
 * — maps to `data-testid` on web, the real RN `testID` prop on native; see
 * `createIcon.tsx` / `createIcon.native.tsx`).
 */
const ICON_FACTORY_CHANNEL_PROPS = [
  'size',
  'color',
  'hoverColor',
  'strokeWidth',
  'strokeLinecap',
  'fill',
  'fillOpacity',
  'style',
  'testID',
]

/** The censused pool props (see `IconCompatPoolProps`). */
const ICON_POOL_PROPS = ['$group-hover', '$group-item-hover', '$xs', '$sm']

/**
 * The supported half of the icon style-prop boundary, derived from the
 * runtime maps above (never hand-retyped): factory SVG channels + CSS-lane
 * resolvers + pool props. `icon-prop-coverage.test.ts` pins supported ∪
 * rejected (`REJECTED_ICON_PROPS`) = the INFRA-3320 census universe, exactly.
 */
export const SUPPORTED_ICON_STYLE_PROPS: readonly string[] = [
  ...ICON_FACTORY_CHANNEL_PROPS,
  ...Object.keys(ICON_CSS_LANE_RESOLVERS),
  ...ICON_POOL_PROPS,
]

/**
 * The pool-admissible surface, derived from the same runtime maps: sizing/
 * color channels + CSS-lane resolvers − base-lane-only props.
 * `icon-pool-surface.test.tsx` renders every entry through the emission
 * contract and type-pins it as `keyof IconCompatPoolStyleProps`.
 */
export const ICON_POOL_STYLE_PROPS = (
  ['size', 'color', ...(Object.keys(ICON_CSS_LANE_RESOLVERS) as IconCssLaneProp[])] as readonly IconPoolCandidateProp[]
).filter(
  (prop): prop is Exclude<IconPoolCandidateProp, IconBaseLaneOnlyProp> =>
    !(ICON_BASE_LANE_ONLY_PROPS as readonly string[]).includes(prop),
)
type IconPoolCandidateProp = 'size' | 'color' | IconCssLaneProp
