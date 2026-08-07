/**
 * Conversion rules for the Tamagui→Mycelium codemod (INFRA-2957).
 *
 * Conversion is an import-path swap at the whole-import-statement level only —
 * never a rewrite of specifiers or props. The compat primitives listed here
 * accept the full legacy prop surface (Flex: INFRA-2948, Text: #36805,
 * TouchableArea: #36943); the typechecker proves the contract after the swap.
 */
import type { NapiConfig } from '@ast-grep/napi'

export const UI_BARREL = 'ui/src'
export const MYCELIUM_BARREL = '@universe/mycelium'
export const UI_ICON_PREFIX = 'ui/src/components/icons/'
export const MYCELIUM_ICON_PREFIX = '@universe/mycelium/icons/'

// ui/src barrel exports with a prop-compatible mycelium counterpart. Grows as
// compat primitives land; keep in sync with the mycelium barrel.
export const CONVERTIBLE_BARREL_SPECIFIERS: ReadonlySet<string> = new Set(['Flex', 'Text', 'TouchableArea'])

export type FlagReason =
  | 'animation-prop'
  | 'group-state-prop'
  | 'mixed-import-statement'
  | 'spread-props'
  | 'styled-call'
  | 'unconvertible-import'

// Constructs that route a file to the manual lane. These are the cases where a
// mechanical swap can silently change behavior (e.g. the Tamagui desktop-first →
// Tailwind mobile-first breakpoint sign-flip hiding inside spreads/styled defs),
// so the codemod must not touch the file at all.
export const FLAG_CONSTRUCT_RULES: ReadonlyArray<{ reason: FlagReason; rule: NapiConfig }> = [
  {
    reason: 'styled-call',
    rule: { rule: { pattern: 'styled($$$ARGS)' } },
  },
  {
    reason: 'animation-prop',
    rule: { rule: { kind: 'jsx_attribute', has: { kind: 'property_identifier', regex: '^animation$' } } },
  },
  {
    reason: 'group-state-prop',
    rule: { rule: { kind: 'jsx_attribute', has: { kind: 'property_identifier', regex: '^\\$group-' } } },
  },
  {
    reason: 'spread-props',
    rule: {
      rule: {
        kind: 'jsx_expression',
        has: { kind: 'spread_element' },
        inside: { any: [{ kind: 'jsx_opening_element' }, { kind: 'jsx_self_closing_element' }] },
      },
    },
  },
]
