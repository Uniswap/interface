/**
 * The single group-state parser for the Tamagui-compatible group surface.
 *
 * A group-state identifier is a group state name (`hover`) optionally prefixed
 * by a group name (`item-hover`, or `item_hover` in Tamagui's marker-class
 * spelling). Everything that reads one goes through this module: the
 * FlexCompat compiler (`$group-*` props → Tailwind `group-*` variants), the
 * parity harness's scope canonicalization (Tamagui `.t_group_*` marker
 * classes), and the workbench parity page/manifest (deriving the group
 * container a `$group-*` case renders inside).
 */
import type { GroupState } from './props'

/** Longest-first so `focusVisible`/`focusWithin` never suffix-match as `focus`. */
export const GROUP_STATES: readonly GroupState[] = ['focusVisible', 'focusWithin', 'hover', 'press', 'focus']

/** Tailwind variant per group state — also the harness's canonical scope spelling. */
export const GROUP_STATE_VARIANT: Record<GroupState, string> = {
  hover: 'group-hover',
  press: 'group-active',
  focus: 'group-focus',
  focusVisible: 'group-focus-visible',
  focusWithin: 'group-focus-within',
}

export interface GroupStateParts {
  /** The group name; undefined targets any ancestor group. */
  name?: string
  state: GroupState
}

/**
 * Split a group-state identifier (`hover`, `item-hover`, `item_hover`, …)
 * into its optional group name and state, given the separator (`-` in prop
 * keys, `_` in Tamagui marker classes). Undefined when the identifier does
 * not end in a group state.
 */
export function parseGroupStateSuffix(identifier: string, separator: '-' | '_'): GroupStateParts | undefined {
  for (const state of GROUP_STATES) {
    if (identifier === state) {
      return { state }
    }
    if (identifier.endsWith(`${separator}${state}`)) {
      return { name: identifier.slice(0, -(state.length + 1)), state }
    }
  }
  return undefined
}

/** Parse a `$group-*` prop key; undefined for non-group keys and container-size group queries. */
export function parseGroupStateProp(key: string): GroupStateParts | undefined {
  if (!key.startsWith('$group-')) {
    return undefined
  }
  return parseGroupStateSuffix(key.slice('$group-'.length), '-')
}

/** The Tailwind variant (= canonical scope) for parsed group-state parts: `group-hover`, `group-active/item`, … */
export function groupStateVariant(parts: GroupStateParts): string {
  const variant = GROUP_STATE_VARIANT[parts.state]
  return parts.name === undefined ? variant : `${variant}/${parts.name}`
}
