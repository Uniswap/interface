// nx-ignore-next-line
import { groupStateVariant, parseGroupStateProp } from '../../../../mycelium/src/compat/group'
/**
 * Per-case expected diffs for the scoped TouchableArea parity comparison.
 *
 * Two sources of expected (pinned, never-silent) differences exist:
 *  - palette drift: semantic color tokens whose values differ between the two
 *    token systems (`palette-drift.ts`), applied per scope from the scope's
 *    own RESOLVED style object — including the `outline-color` drift the
 *    frame's `$neutral3` focus ring pins on every focusable case;
 *  - structural pins: the `animation` declaration animation presets add on
 *    the Tailwind side (same pin as Flex).
 *
 * The pools are derived from the same resolver the compat compiler uses
 * (`resolveTouchableAreaCompatProps`), so the frame defaults and variant
 * styles the component injects are pinned exactly once, in the resolver.
 */
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import type {
  TouchableAreaCompatProps,
  TouchableAreaCompatStyleProps,
} from '../../../../mycelium/src/touchable-area/compile'
// nx-ignore-next-line
import { resolveTouchableAreaCompatProps } from '../../../../mycelium/src/touchable-area/resolve'
import type { DeclarationDiff } from '../core/diff'
import { expectedDrift, PALETTE_DRIFT } from '../core/palette-drift'
import { BASE_SCOPE } from '../core/scope'
import type { ThemeName } from '../core/theme'
import { MEDIA_SCOPE_KEY, PSEUDO_SCOPE_KEY } from '../flex/expectations'

/**
 * Drift for one resolved style object: the shared bg/border drift plus the
 * outline-color drift TouchableArea's `$neutral3` focus ring introduces.
 */
function styleObjectDrift(style: TouchableAreaCompatStyleProps | undefined, theme: ThemeName): DeclarationDiff {
  if (style === undefined) {
    return {}
  }
  const diff = expectedDrift(style, theme)
  const outlineColor = (style as { outlineColor?: string }).outlineColor
  if (outlineColor !== undefined && Object.hasOwn(PALETTE_DRIFT[theme], outlineColor)) {
    diff['outline-color'] = { ...PALETTE_DRIFT[theme][outlineColor] }
  }
  return diff
}

/**
 * The full expected scope → diff map for one matrix case, computed from the
 * RESOLVED prop pools. Scopes not present in the map must diff empty.
 */
export function expectedScopedDiffs(props: TouchableAreaCompatProps, theme: ThemeName): Map<string, DeclarationDiff> {
  const resolved = resolveTouchableAreaCompatProps(props)
  const out = new Map<string, DeclarationDiff>()
  const mergeDiff = (scope: string, diff: DeclarationDiff): void => {
    if (Object.keys(diff).length > 0) {
      out.set(scope, { ...out.get(scope), ...diff })
    }
  }

  mergeDiff(BASE_SCOPE, styleObjectDrift(resolved, theme))
  mergeDiff(BASE_SCOPE, styleObjectDrift(resolved['$platform-web'], theme))
  mergeDiff(BASE_SCOPE, styleObjectDrift(resolved[`$theme-${theme}`], theme))

  const scopedPools: Array<[string, TouchableAreaCompatStyleProps | undefined]> = [
    ...Object.entries(PSEUDO_SCOPE_KEY).map(
      ([pseudoKey, scope]): [string, TouchableAreaCompatStyleProps | undefined] => [
        scope,
        resolved[pseudoKey as keyof typeof PSEUDO_SCOPE_KEY],
      ],
    ),
    ...Object.entries(MEDIA_SCOPE_KEY).map(([mediaKey, scope]): [string, TouchableAreaCompatStyleProps | undefined] => [
      scope,
      resolved[mediaKey as keyof typeof MEDIA_SCOPE_KEY],
    ]),
  ]
  for (const [scope, pool] of scopedPools) {
    if (pool === undefined) {
      continue
    }
    mergeDiff(scope, styleObjectDrift(pool, theme))
    for (const [pseudoKey, pseudoScope] of Object.entries(PSEUDO_SCOPE_KEY)) {
      const nested = (pool as Partial<Record<string, TouchableAreaCompatStyleProps>>)[pseudoKey]
      if (nested !== undefined) {
        mergeDiff(`${scope}+${pseudoScope}`, styleObjectDrift(nested, theme))
      }
    }
  }

  // Group-state pools: the legacy frame is itself a group named 'true', so
  // Tamagui resolves group props against the runtime group context — a bare
  // $group-hover binds to the 'true' group, and a named group absent from the
  // context emits nothing. The compat compiles context-free Tailwind group
  // variants (the shared FlexCompat convention: bare `group-*` for any
  // ancestor group, `group-*/name` for named ones), which is the equivalent
  // observable inside a real subtree that renders the group container. The
  // scope relocation is pinned per declaration below.
  for (const key of Object.keys(resolved)) {
    const parts = parseGroupStateProp(key)
    if (parts === undefined) {
      continue
    }
    const variant = groupStateVariant(parts)
    const pool = resolved[key as keyof TouchableAreaCompatProps] as TouchableAreaCompatStyleProps
    for (const [prop, value] of Object.entries(normalizedSimpleDeclarations(pool))) {
      if (parts.name === undefined) {
        mergeDiff(variant, { [prop]: { tailwind: value } })
        mergeDiff(`${variant}/true`, { [prop]: { tamagui: value } })
      } else {
        mergeDiff(variant, { [prop]: { tailwind: value } })
      }
    }
  }

  // Runtime-measured minimum dimensions: the legacy component pins 24×24 via
  // measured state (jsdom rects are 0×0, so the harness always observes the
  // minimum); the pure compiled className cannot carry runtime state. The
  // compat component replicates the measurement through its ResizeObserver
  // layout path, covered by component unit tests.
  if (props.shouldConsiderMinimumDimensions === true) {
    mergeDiff(BASE_SCOPE, {
      width: { tamagui: '24px' },
      height: { tamagui: '24px' },
    })
  }

  return out
}

/**
 * Normalized declaration literals for the group-pool pins. The group matrix
 * rows deliberately stick to opacity/scale (see matrix.ts); anything else
 * throws so a future color row cannot silently skip its pin.
 */
function normalizedSimpleDeclarations(pool: TouchableAreaCompatStyleProps): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [prop, value] of Object.entries(pool)) {
    if (prop === 'opacity') {
      out['opacity'] = String(value)
    } else if (prop === 'scale') {
      out['transform'] = `scale(${String(value)})`
    } else {
      throw new Error(`touchable-area group pins: unsupported declaration "${prop}" — extend the pin table`)
    }
  }
  return out
}
