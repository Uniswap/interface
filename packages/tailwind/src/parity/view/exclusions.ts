/**
 * The explicit exclusions ledger for the View parity block: everything about
 * the Tamagui `View` surface this block does NOT prove byte-identical, with
 * the reason and the verification that stands in. Nothing is silently
 * skipped — anything not listed here is either diffed per scope by the layout
 * matrix or fails the suite.
 */

export interface ParityExclusion {
  area: string
  reason: string
  standIn: string
}

export const PARITY_EXCLUSIONS: readonly ParityExclusion[] = [
  {
    area: 'Non-layout style pools (colors, visuals, pseudo states, media, platform/theme, group, long tail)',
    reason:
      'ViewCompat is a thin binding of the exact shared compat compiler FlexCompat uses (INFRA-2950 ' +
      'demotes View from the critical path — playbook §3 — so its block deliberately stays small); ' +
      're-proving every shared pool per component would duplicate the Flex matrix verbatim.',
    standIn:
      'The Flex binding of this suite diffs every shared pool byte-level through the same ' +
      '`composeCompatClassName` / `commonStyleClasses` code paths; the View matrix pins the layout ' +
      'families (display / position / dimension / flex / spacing) plus the frame defaults, and the ' +
      'component contract asserts the View and Flex frame bases compile identically.',
  },
  {
    area: 'Raw enterStyle / exitStyle objects and runtime animation timing',
    reason:
      'Arbitrary per-call-site enter/exit styles would require runtime keyframe generation, and timing ' +
      'configs are Tamagui animation-driver concerns resolved at runtime; the plain Tamagui View has ' +
      'no animateEnter/animateExit preset variants (those are Flex styled-variants).',
    standIn:
      'Type-level exclusion for enterStyle/exitStyle; the shared preset mechanics and keyframe ' +
      'endpoints are proven by the Flex binding of this suite.',
  },
  {
    area: 'Runtime interaction wiring (onPress family, onLongPress, disabled gating, onLayout)',
    reason:
      'Event dispatch is runtime behavior a CSS diff cannot prove; ViewCompat renders through the same ' +
      'shared DOM wrapper (`createCompatComponent`) as FlexCompat with no View-specific wiring.',
    standIn:
      'The shared wrapper behavior (click co-dispatch, disabled detachment, aria-disabled attribute, ' +
      'ResizeObserver onLayout) is asserted by the FlexCompat component contract in flex.test.tsx; ' +
      'view.test.tsx asserts the component renders exactly the classes the pure compiler produces.',
  },
  {
    area: 'Native rendering props',
    reason:
      'Native-only hints (collapsable, removeClippedSubviews, hitSlop, …) have no web effect in ' +
      'Tamagui either; uniwind resolves classNames on native, which is the INFRA-2353 follow-up and ' +
      'not provable in this web harness.',
    standIn: 'Accepted-and-inert props, enumerated in the shared compat prop contract.',
  },
] as const
