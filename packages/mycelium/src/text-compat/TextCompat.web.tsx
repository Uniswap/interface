import * as React from 'react'
import { cn } from '../cn'
import { mergeCompatStyle } from '../compat/compose'
import { createCompatComponent } from '../compat/dom'
import { GROUP_STATE_PROP_PREFIX } from '../compat/group'
import { MEDIA_VARIANT } from '../compat/media'
import { markMyceliumPrimitive } from '../compat/primitive-marker'
import type { MediaPropKey } from '../compat/props'
import { PSEUDO_STYLE_KEYS } from '../compat/pseudo'
import type { SafeCompatTag } from '../compat/safe-tags'
import { RESET_CLASSES } from '../compat/style-classes'
import { ANCHOR_BASE_VAR, ANCHOR_PSEUDO_CODE, anchorPseudoVar } from './anchor-vars'
import { TEXT_PLACEHOLDER_OVERLAY_CLASSES, textCompatEmission } from './compile'
import { resolveTextCompatDefaults } from './defaults'
import type { ColorValue, TextCompatProps } from './props'
import { colorCssExpression } from './tokens'

/**
 * Web-only, drop-in replacement for the `ui/src` Tamagui `Text`, rendering
 * the same CSS via Tailwind classes (see `./compile`) through the shared
 * compat DOM wrapper (`../compat/dom`). The workbench harness
 * (`labs/workbench/scripts/verify-text-parity.mts`) proves the equivalence
 * per variant, color, typography prop, state, media pool, and loading state.
 *
 * Exported from the root barrel as the canonical `Text` (INFRA-3040); the cva
 * Text in `components/text.tsx` is deprecated.
 */

const VARIANT_TAG: Partial<Record<string, SafeCompatTag>> = {
  heading1: 'h1',
  heading2: 'h2',
  heading3: 'h3',
}

const TextCompatFrame = createCompatComponent<TextCompatProps>(textCompatEmission, 'TextCompatFrame')

/**
 * What the legacy Tamagui `Flex` contributes on web (react-native-web view
 * defaults) — the loading placeholder recreates the legacy DOM structure with
 * these, verified by the parity harness.
 */
const VIEW_CLASSES = `flex flex-col items-stretch basis-auto ${RESET_CLASSES} shrink-0`

/**
 * The shimmer overlay (legacy `TextPlaceholder`): a rounded surface3 bar over
 * a screen-reader-hidden copy of the text.
 */
function TextCompatPlaceholder({ children }: React.PropsWithChildren<unknown>): React.JSX.Element {
  /* oxlint-disable react/forbid-elements -- recreates the legacy TextPlaceholder DOM (RNW Flex views) verbatim; mycelium has no Flex-with-view-defaults primitive */
  return (
    <div className={`${VIEW_CLASSES} flex-row items-center`} data-testid="text-placeholder">
      <div className={`${VIEW_CLASSES} flex-row items-center`}>
        <div className={VIEW_CLASSES}>{children}</div>
        <div className={cn(VIEW_CLASSES, TEXT_PLACEHOLDER_OVERLAY_CLASSES)} />
      </div>
    </div>
  )
  /* oxlint-enable react/forbid-elements */
}

/** The legacy `Shine` shimmer: a masked wrapper animating its mask position. */
function ShineWrapper({ children }: React.PropsWithChildren<unknown>): React.JSX.Element {
  return (
    // oxlint-disable-next-line react/forbid-elements -- recreates the legacy Shine wrapper (an RNW Flex view) verbatim
    <div
      className={VIEW_CLASSES}
      style={{
        WebkitMaskImage: 'linear-gradient(-75deg, rgba(0,0,0,0.5) 30%, #000 50%, rgba(0,0,0,0.5) 70%)',
        WebkitMaskSize: '200%',
        animationName: 'stext-shine',
        animationDuration: '1s',
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
      }}
    >
      {children}
    </div>
  )
}

export { resolveTextCompatDefaults }

/** Base color and pseudo vars ride the style attribute: it outranks any author CSS a host app aims at anchors. */
function anchorColorLane(styleProps: TextCompatProps): AnchorLane {
  const { color } = styleProps
  if (typeof color !== 'string' || anyNestingPoolRecolors(styleProps)) {
    return NO_ANCHOR_LANE
  }
  const base = colorCssExpression(color)
  if (!anyPseudoPoolRecolors(styleProps)) {
    return { style: { color: base }, pools: undefined }
  }
  // A forced pool compiles at the base tier, so no gated attribute rule mirrors it.
  if (styleProps.forceStyle !== undefined) {
    return NO_ANCHOR_LANE
  }
  const vars: Record<string, string> = { [ANCHOR_BASE_VAR]: base }
  const pools: string[] = []
  for (const pseudoKey of PSEUDO_STYLE_KEYS) {
    const pool = styleProps[pseudoKey]
    if (!poolRecolors(pool)) {
      continue
    }
    const code = ANCHOR_PSEUDO_CODE[pseudoKey]
    vars[anchorPseudoVar(code)] = colorCssExpression((pool as { color: ColorValue }).color)
    pools.push(code)
  }
  return { style: vars as React.CSSProperties, pools: pools.join(' ') }
}

interface AnchorLane {
  style: React.CSSProperties | undefined
  pools: string | undefined
}

const NO_ANCHOR_LANE: AnchorLane = { style: undefined, pools: undefined }

/**
 * The web-applied pools that can nest pseudo pools — exactly the pools
 * `compose.ts` walks with `pushStyleAndPseudo`: the media pools,
 * `$platform-web`, and the theme pools. The native-only platform pools are
 * deliberately absent: they never compile on web, so a color inside them must
 * not suppress the anchor's inline base color.
 */
const NESTING_POOL_KEYS: readonly (MediaPropKey | '$platform-web' | '$theme-dark' | '$theme-light')[] = [
  ...(Object.keys(MEDIA_VARIANT) as MediaPropKey[]),
  '$platform-web',
  '$theme-dark',
  '$theme-light',
]

/** True when a pool object carries a color declaration the compiler would emit. */
function poolRecolors(pool: unknown): boolean {
  return typeof pool === 'object' && pool !== null && 'color' in pool && pool.color !== undefined
}

function anyPseudoPoolRecolors(styleProps: TextCompatProps): boolean {
  return PSEUDO_STYLE_KEYS.some((pseudoKey) => poolRecolors(styleProps[pseudoKey]))
}

/**
 * True when any class-compiled NESTING pool re-colors the element, walking the
 * exact pool grammar `compose.ts` compiles on web: the media / `$platform-web`
 * / theme pools with their nested pseudo pools, and the `$group-*` pools
 * (flat). Enumerated rather than shape-sniffed so nested re-colors
 * (`$md={{ hoverStyle: { color } }}`) are caught, and props the web compiler
 * never reads (`$platform-ios`, a pool whose color is `undefined`) don't
 * suppress the inline color they cannot repaint.
 */
function anyNestingPoolRecolors(styleProps: TextCompatProps): boolean {
  for (const poolKey of NESTING_POOL_KEYS) {
    const pool = styleProps[poolKey]
    if (pool === undefined) {
      continue
    }
    if (poolRecolors(pool)) {
      return true
    }
    for (const pseudoKey of PSEUDO_STYLE_KEYS) {
      if (poolRecolors(pool[pseudoKey])) {
        return true
      }
    }
  }
  for (const [key, value] of Object.entries(styleProps)) {
    if (key.startsWith(GROUP_STATE_PROP_PREFIX) && poolRecolors(value)) {
      return true
    }
  }
  return false
}

export const TextCompat = React.forwardRef<HTMLElement, TextCompatProps>(function TextCompat(props, ref) {
  const { loading = false, loadingPlaceholderText = '000.00', ...rest } = props
  const styleProps = resolveTextCompatDefaults({ loading, props: rest })
  const tag = rest.tag ?? VARIANT_TAG[styleProps.variant ?? 'body2'] ?? 'span'
  // The user style prop still wins: the canonical merge flattens RN
  // array/falsy forms and puts the caller side last, over the anchor color.
  const anchorLane = tag === 'a' ? anchorColorLane(styleProps) : NO_ANCHOR_LANE
  const style = mergeCompatStyle(anchorLane.style, styleProps.style)

  const element = (
    <TextCompatFrame {...styleProps} style={style} tag={tag} data-stext-anchor={anchorLane.pools} ref={ref}>
      {/* children must not render while loading (they may still be fetching);
          the placeholder text sizes the loading bar instead, like the legacy Text. */}
      {loading ? loadingPlaceholderText : rest.children}
    </TextCompatFrame>
  )

  if (!loading) {
    return element
  }
  const placeholder = <TextCompatPlaceholder>{element}</TextCompatPlaceholder>
  return loading === 'no-shimmer' ? placeholder : <ShineWrapper>{placeholder}</ShineWrapper>
})

// Not a bare `createCompatComponent` call, so the legacy-color-injection
// opt-out (compat/primitive-marker.ts) is stamped here explicitly.
markMyceliumPrimitive(TextCompat)
