/**
 * Canonical rule scopes for the parity harness.
 *
 * Both systems scope declarations beyond the base element state — pseudo
 * classes, media queries, group states, enter/exit animation states, and the
 * dark-theme class. Each side's syntax differs; this module reduces both to
 * one canonical scope key so declarations can be diffed per scope.
 *
 * Documented equivalences folded here:
 * - Tamagui guards `:hover` rules with `@media (hover)`; Tailwind uses
 *   `@media (hover: hover)`. Same media feature in boolean/explicit form —
 *   both fold into the `hover` scope.
 * - Tamagui group states toggle marker classes from JS
 *   (`.t_group_<name>_hover <el>`); Tailwind uses pure CSS
 *   (`&:is(:where(.group/<name>):hover *)`, hover-media-guarded). Both mean
 *   "the named ancestor group is hovered" and fold into `group-hover/<name>`.
 * - Tamagui gates enter styles behind the `.t_unmounted` class it removes
 *   after mount; the Tailwind side expresses the same start state as the
 *   enter keyframe's `from` frame. Both fold into `enter`.
 * - Tamagui gates disabledStyle rules behind an `[aria-disabled]` attribute
 *   selector (the `disabled` prop sets the attribute); Tailwind's
 *   `aria-disabled:` variant is `[aria-disabled="true"]`. Same gate for a
 *   React-rendered boolean attribute — both fold into `disabled`.
 */
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import { type GroupStateParts, groupStateVariant, parseGroupStateSuffix } from '../../../../mycelium/src/compat/group'

export { parseGroupStateSuffix, groupStateVariant, type GroupStateParts }

export interface RuleScope {
  media: string[]
  pseudo?: 'hover' | 'active' | 'focus' | 'focus-visible' | 'focus-within' | 'disabled'
  /** `group-hover`, `group-active/item`, … (Tailwind variant spelling). */
  group?: string
  enter?: boolean
  exit?: boolean
  dark?: boolean
}

export const BASE_SCOPE = ''

/**
 * Theme folding, shared by both sides of the harness: a scope key's
 * `dark`/`light` part expresses "only under that theme", so when comparing a
 * specific theme the matching theme part folds away (the declarations apply —
 * they merge into the remaining scope, overriding its earlier declarations,
 * exactly like the higher-specificity theme rules do in the cascade) and the
 * opposite theme's scopes drop entirely. Returns the folded key, or undefined
 * when the scope does not apply under `theme`.
 */
export function foldThemeScopeKey(key: string, theme: 'light' | 'dark'): string | undefined {
  const parts = key === BASE_SCOPE ? [] : key.split('+')
  const themePart = parts.find((part) => part === 'dark' || part === 'light')
  if (themePart === undefined) {
    return key
  }
  if (themePart !== theme) {
    return undefined
  }
  return parts.filter((part) => part !== themePart).join('+')
}

/** Normalize a media query's text: lowercase, no spaces. */
function canonicalMedia(query: string): string {
  return query
    .replace(/^@media\s*/, '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

const HOVER_GUARD_MEDIA = new Set(['(hover)', '(hover:hover)'])

/**
 * A media list's individual conjuncts: Tamagui combines conditions into one
 * query (`(hover) and (max-width: 450px)`), Tailwind nests separate `@media`
 * blocks — both reduce to the same conjunct set.
 */
function mediaConjuncts(media: string[]): string[] {
  return media.flatMap((query) => canonicalMedia(query).split('and').filter(Boolean))
}

/** Build the canonical scope key from parsed parts. */
export function scopeKey(scope: RuleScope): string {
  // The hover-capability guard is part of the canonical hover/group-hover
  // scope itself: Tamagui guards `:hover` rules with `(hover)`, Tailwind with
  // `(hover: hover)`; Tamagui's unnamed-group JS toggle only fires on
  // hover-capable devices.
  const foldHoverGuard = scope.pseudo === 'hover' || scope.group?.startsWith('group-hover') === true
  const conjuncts = [...new Set(mediaConjuncts(scope.media))].filter(
    (query) => !(foldHoverGuard && HOVER_GUARD_MEDIA.has(query)),
  )
  const parts = [
    ...conjuncts.sort().map((query) => `media${query}`),
    scope.pseudo,
    scope.group,
    scope.enter === true ? 'enter' : undefined,
    scope.exit === true ? 'exit' : undefined,
    scope.dark === true ? 'dark' : scope.dark === false ? 'light' : undefined,
  ].filter((part): part is string => part !== undefined)
  return parts.join('+')
}

const TAMAGUI_PSEUDO: Record<string, RuleScope['pseudo']> = {
  ':hover': 'hover',
  ':active': 'active',
  ':focus': 'focus',
  ':focus-visible': 'focus-visible',
  ':focus-within': 'focus-within',
}

export interface ParsedTamaguiSelector {
  /** The atomic class the declarations attach to (with leading dot stripped). */
  className: string
  scope: Omit<RuleScope, 'media'>
  /**
   * Number of `:root` prefixes — Tamagui's precedence mechanism. Extraction
   * resolves same-scope conflicts by this specificity, like the cascade does.
   */
  specificity: number
}

/** Apply an ancestor selector part to the scope; false when unrecognized. */
function applyTamaguiAncestor(ancestor: string, scope: Omit<RuleScope, 'media'>): boolean {
  if (ancestor === '.t_unmounted') {
    scope.enter = true
    return true
  }
  if (ancestor === '.t_dark') {
    scope.dark = true
    return true
  }
  if (ancestor === '.t_light') {
    scope.dark = false
    return true
  }
  if (!ancestor.startsWith('.t_group_')) {
    return false
  }
  const identifier = ancestor.slice('.t_group_'.length)
  // Named groups scope via a real pseudo class (`.t_group_item:hover`);
  // unnamed groups via a JS-toggled marker (`.t_group_hover`).
  const pseudoIdx = identifier.indexOf(':')
  if (pseudoIdx !== -1) {
    const pseudo = TAMAGUI_PSEUDO[identifier.slice(pseudoIdx)]
    if (pseudo === undefined) {
      return false
    }
    scope.group = `group-${pseudo}/${identifier.slice(0, pseudoIdx)}`
    return true
  }
  const parts = parseGroupStateSuffix(identifier, '_')
  if (parts === undefined) {
    return false
  }
  scope.group = groupStateVariant(parts)
  return true
}

const TAMAGUI_PSEUDO_SUFFIXES = [':hover', ':active', ':focus-visible', ':focus-within', ':focus'] as const

/**
 * Parse one Tamagui atomic-rule selector (a single comma-free selector).
 * Returns undefined for selectors that aren't element-attached atomic rules
 * (theme blocks, keyframes, the group container marker itself).
 */
export function parseTamaguiSelector(single: string): ParsedTamaguiSelector | undefined {
  const trimmed = single.trim()
  const specificity = trimmed.split(':root').length - 1
  let selector = trimmed
  while (selector.startsWith(':root')) {
    selector = selector.slice(':root'.length)
  }
  selector = selector.trim()
  const scope: Omit<RuleScope, 'media'> = {}

  const combinatorParts = selector.split(/\s+/).filter(Boolean)
  if (combinatorParts.length === 2) {
    // `<ancestor> ._x` — enter/theme/group scoping via an ancestor class.
    const [ancestor = '', rest = ''] = combinatorParts
    if (!applyTamaguiAncestor(ancestor, scope)) {
      return undefined
    }
    selector = rest
  } else if (combinatorParts.length === 1) {
    selector = combinatorParts[0] ?? ''
    // `._x.t_unmounted` — the enter-state rule's second alternative.
    if (selector.endsWith('.t_unmounted')) {
      scope.enter = true
      selector = selector.slice(0, -'.t_unmounted'.length)
    }
  } else {
    return undefined
  }

  // disabledStyle rules: `._x[aria-disabled]` (the disabled prop sets the attribute).
  if (selector.endsWith('[aria-disabled]')) {
    scope.pseudo = 'disabled'
    selector = selector.slice(0, -'[aria-disabled]'.length)
  }

  for (const suffix of TAMAGUI_PSEUDO_SUFFIXES) {
    if (selector.endsWith(suffix)) {
      scope.pseudo = TAMAGUI_PSEUDO[suffix]
      selector = selector.slice(0, -suffix.length)
      break
    }
  }

  if (!selector.startsWith('.') || /[\s>+~:[]/.test(selector.slice(1))) {
    return undefined
  }
  return { className: selector.slice(1), scope, specificity }
}

export interface ParsedTailwindSelector {
  className: string
  scope: Omit<RuleScope, 'media' | 'enter'>
}

/** Parse a `&:is(:where(.group…):<state> *)` variant part to its canonical group scope. */
function parseTailwindGroupPart(part: string): string | undefined {
  const prefix = '&:is(:where(.group'
  const suffix = ' *)'
  if (!part.startsWith(prefix) || !part.endsWith(suffix)) {
    return undefined
  }
  const inner = part.slice(prefix.length, -suffix.length)
  const closeIdx = inner.indexOf(')')
  if (closeIdx === -1) {
    return undefined
  }
  const namePart = inner.slice(0, closeIdx)
  const statePart = inner.slice(closeIdx + 1)
  if (!statePart.startsWith(':')) {
    return undefined
  }
  const state = statePart.slice(1)
  if (!['hover', 'active', 'focus', 'focus-visible', 'focus-within'].includes(state)) {
    return undefined
  }
  if (namePart === '') {
    return `group-${state}`
  }
  if (!namePart.startsWith('\\/')) {
    return undefined
  }
  return `group-${state}/${namePart.slice(2)}`
}

/**
 * Parse a flattened Tailwind rule's nested-selector parts (everything after
 * the utility class itself, each part beginning with `&`).
 */
export function parseTailwindNestedParts(parts: string[]): Omit<RuleScope, 'media' | 'enter'> | undefined {
  const scope: Omit<RuleScope, 'media' | 'enter'> = {}
  for (const part of parts) {
    const trimmed = part.trim()
    const pseudo = TAMAGUI_PSEUDO[trimmed.replace('&', '')]
    if (pseudo !== undefined) {
      scope.pseudo = pseudo
      continue
    }
    const group = parseTailwindGroupPart(trimmed)
    if (group !== undefined) {
      scope.group = group
      continue
    }
    if (trimmed === '&:is(.dark *)') {
      scope.dark = true
      continue
    }
    if (trimmed === '&:not(:is(.dark *))' || trimmed === '&:not(*:is(.dark *))') {
      // $theme-light — the complement scope; canonicalized as its own key.
      scope.dark = false
      continue
    }
    if (trimmed === '&[aria-disabled="true"]') {
      // The `aria-disabled:` variant — canonically the same gate as Tamagui's
      // `[aria-disabled]` (React renders the boolean attribute as "true").
      scope.pseudo = 'disabled'
      continue
    }
    if (trimmed === '&[data-exiting]') {
      scope.exit = true
      continue
    }
    return undefined
  }
  return scope
}
