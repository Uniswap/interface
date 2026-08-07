// nx-ignore-next-line
import { groupStateVariant, parseGroupStateProp } from '../../../../mycelium/src/compat/group'
/**
 * Per-case expected diffs for the scoped parity comparison.
 *
 * Two sources of expected (pinned, never-silent) differences exist:
 *  - palette drift: semantic color tokens whose values differ between the two
 *    token systems (`palette-drift.ts`), applied per scope from the scope's
 *    own style object;
 *  - structural pins: documented one-sided declarations (`exclusions.ts`) —
 *    the `animation` declaration animation presets add on the Tailwind side,
 *    and the container declarations Tamagui adds on group containers.
 */
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import type { FlexCompatProps, FlexCompatStyleProps } from '../../../../mycelium/src/flex-compat/compile'
import type { DeclarationDiff } from '../core/diff'
import { expectedDrift } from '../core/palette-drift'
import { BASE_SCOPE } from '../core/scope'
import type { ThemeName } from '../core/theme'

export const MEDIA_SCOPE_KEY = {
  $xxs: 'media(max-width:360px)',
  $xs: 'media(max-width:380px)',
  $sm: 'media(max-width:450px)',
  $md: 'media(max-width:640px)',
  $lg: 'media(max-width:768px)',
  $xl: 'media(max-width:1024px)',
  $xxl: 'media(max-width:1280px)',
  $xxxl: 'media(max-width:1536px)',
  $short: 'media(max-height:736px)',
  $midHeight: 'media(max-height:800px)',
  $lgHeight: 'media(max-height:960px)',
} as const

export const PSEUDO_SCOPE_KEY = {
  hoverStyle: 'hover',
  pressStyle: 'active',
  focusStyle: 'focus',
  focusVisibleStyle: 'focus-visible',
  focusWithinStyle: 'focus-within',
  disabledStyle: 'disabled',
} as const

export function groupScopeKey(propKey: string): string | undefined {
  const parts = parseGroupStateProp(propKey)
  return parts === undefined ? undefined : groupStateVariant(parts)
}

/** Post-normalization `animation` declaration per preset utility (see css/compat.css). */
const ENTER_ANIMATION_DECLARATION: Partial<Record<string, string>> = {
  fadeIn: 'spore-enter-fade-in 200ms ease-out',
  fadeInDown: 'spore-enter-fade-in-down 200ms ease-out',
}

const ENTER_OF_ENTER_EXIT: Partial<Record<string, string>> = {
  fadeInDownOutUp: 'fadeInDown',
  fadeInDownOutDown: 'fadeInDown',
  fadeInOut: 'fadeIn',
}

function styleObjectDrift(style: FlexCompatStyleProps | undefined, theme: ThemeName): DeclarationDiff {
  return style === undefined ? {} : expectedDrift(style, theme)
}

/**
 * The full expected scope → diff map for one matrix case. Scopes not present
 * in the map must diff empty.
 */
export function expectedScopedDiffs(props: FlexCompatProps, theme: ThemeName): Map<string, DeclarationDiff> {
  const out = new Map<string, DeclarationDiff>()
  const mergeDiff = (scope: string, diff: DeclarationDiff): void => {
    if (Object.keys(diff).length > 0) {
      out.set(scope, { ...out.get(scope), ...diff })
    }
  }

  // Base pool + $platform-web (merged into base on web) + the matching
  // $theme-* pool (theme scopes fold into base for the compared theme; the
  // opposite theme's pool drops on both sides).
  mergeDiff(BASE_SCOPE, styleObjectDrift(props, theme))
  mergeDiff(BASE_SCOPE, styleObjectDrift(props['$platform-web'], theme))
  mergeDiff(BASE_SCOPE, styleObjectDrift(props[`$theme-${theme}`], theme))

  const scopedPools: Array<
    [string, (FlexCompatStyleProps & Partial<Record<keyof typeof PSEUDO_SCOPE_KEY, FlexCompatStyleProps>>) | undefined]
  > = [
    ...Object.entries(PSEUDO_SCOPE_KEY).map(([pseudoKey, scope]): [string, FlexCompatStyleProps | undefined] => [
      scope,
      props[pseudoKey as keyof typeof PSEUDO_SCOPE_KEY],
    ]),
    ...Object.entries(MEDIA_SCOPE_KEY).map(([mediaKey, scope]): [string, FlexCompatStyleProps | undefined] => [
      scope,
      props[mediaKey as keyof typeof MEDIA_SCOPE_KEY],
    ]),
  ]
  for (const [scope, pool] of scopedPools) {
    if (pool === undefined) {
      continue
    }
    mergeDiff(scope, styleObjectDrift(pool, theme))
    // One nesting level: pseudo pools inside media pools.
    for (const [pseudoKey, pseudoScope] of Object.entries(PSEUDO_SCOPE_KEY)) {
      const nested = (pool as Partial<Record<string, FlexCompatStyleProps>>)[pseudoKey]
      if (nested !== undefined) {
        mergeDiff(`${scope}+${pseudoScope}`, styleObjectDrift(nested, theme))
      }
    }
  }

  for (const key of Object.keys(props)) {
    const scope = groupScopeKey(key)
    if (scope !== undefined) {
      mergeDiff(scope, styleObjectDrift(props[key as keyof FlexCompatProps] as FlexCompatStyleProps, theme))
    }
  }

  // Structural pin: enter presets add a base `animation` declaration on the
  // Tailwind side only (Tamagui's timing lives in its runtime driver).
  const enterPreset =
    props.animateEnter ??
    (props.animateEnterExit !== undefined ? ENTER_OF_ENTER_EXIT[props.animateEnterExit] : undefined)
  if (enterPreset !== undefined) {
    const declaration = ENTER_ANIMATION_DECLARATION[enterPreset]
    if (declaration !== undefined) {
      mergeDiff(BASE_SCOPE, { animation: { tailwind: declaration } })
    }
  }

  // Structural pin: Tamagui group containers declare container-name/type
  // (container-query + native-measuring support); the Tailwind group marker
  // class is inert by design. See exclusions.ts.
  if (props.group !== undefined && props.group !== false) {
    mergeDiff(BASE_SCOPE, {
      'container-name': { tamagui: props.group === true ? 'true' : String(props.group) },
      'container-type': { tamagui: 'inline-size' },
    })
  }

  return out
}
