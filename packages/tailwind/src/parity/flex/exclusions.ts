/**
 * The explicit exclusions ledger: everything about the Tamagui Flex surface
 * the parity suite does NOT prove byte-identical, with the reason and the
 * verification that stands in. Nothing is silently skipped — anything not
 * listed here is either diffed per scope by the matrix or fails the suite.
 */

export interface ParityExclusion {
  area: string
  reason: string
  standIn: string
}

export const PARITY_EXCLUSIONS: readonly ParityExclusion[] = [
  {
    area: 'Animation timing (duration / easing curves)',
    reason:
      'Tamagui timing comes from its animation driver at runtime (`animation` prop, spring configs); ' +
      'the CSS presets carry a fixed 200ms ease-out.',
    standIn:
      'Keyframe endpoint declarations are diffed against Tamagui enter-state CSS (enter) and the ' +
      'preset source styles (exit); the `animation` prop is accepted and its timing config ignored.',
  },
  {
    area: 'Exit animations at unmount',
    reason:
      'Pure CSS cannot observe unmount; Tamagui runs exitStyle via AnimatePresence. FlexCompat gates ' +
      'exit keyframes behind `[data-exiting]` for the caller / a future presence helper to trigger.',
    standIn:
      'The `[data-exiting]`-scoped animation declaration is asserted, and exit keyframe end frames are ' +
      'diffed against the `ui/src` preset exitStyle definitions.',
  },
  {
    area: 'Raw enterStyle / exitStyle objects',
    reason:
      'Arbitrary per-call-site enter/exit styles would require runtime keyframe generation; the shared ' +
      'presets (animateEnter/animateExit/animateEnterExit) are the supported Flex surface.',
    standIn: 'Type-level exclusion; the preset pools are fully covered.',
  },
  {
    area: 'Group container containment declarations',
    reason:
      'Tamagui marks group containers with `container-name`/`container-type: inline-size` to support ' +
      'container-size queries ($group-sm) and native measuring; Tailwind group markers are inert ' +
      'classes and group states are pure CSS, so the containment declarations are intentionally not ' +
      'replicated (inline-size containment changes layout behavior).',
    standIn:
      'Pinned per-case expected diff on the group-container matrix cases; `$group-<breakpoint>` ' +
      'container-size props throw at compile time.',
  },
  {
    area: 'Group state mechanism',
    reason:
      'Tamagui toggles marker classes from JS events (`.t_group_hover …`); Tailwind uses pure CSS ' +
      '(`:where(.group):hover`, hover-media-guarded). Same observable state on web.',
    standIn: 'Scoped declarations are diffed under the canonical `group-*` scope (see scope.ts).',
  },
  {
    area: 'Theme subtree providers',
    reason:
      'The `theme`/`themeInverse`/`themeShallow` props re-theme a subtree via context; web Tailwind ' +
      'theming is the `.dark` ancestor class. `$theme-dark`/`$theme-light` cover per-theme styling.',
    standIn: 'Props accepted and inert; documented in the type-parity exclusion list.',
  },
  {
    area: 'Deprecated child-spacing props (space / spaceDirection / separator)',
    reason:
      'Tamagui web still honors this deprecated trio — it injects Spacer / separator elements between ' +
      'children — but the props are deprecated upstream in favor of `gap`, and replicating the child ' +
      'injection would couple FlexCompat to Tamagui component internals. FlexCompat deliberately ' +
      'accepts-and-ignores them: call sites keep compiling, and spacing must be expressed via `gap` ' +
      'when a call site migrates.',
    standIn:
      'Type-level acceptance in the prop contract (documented @deprecated accept-and-ignore); the gap ' +
      'pools are fully covered by the matrix, so the replacement surface is proven.',
  },
  {
    area: 'Runtime interaction wiring (onPress family, onLongPress, disabled gating)',
    reason:
      'Event dispatch is runtime behavior a CSS diff cannot prove. FlexCompat mirrors the Tamagui web ' +
      'wiring: press → click (invoking onPress and onLongPress together — Tamagui web has no ' +
      'long-press timing), pressIn/Out → pointer down/up, hoverIn/Out → mouseenter/leave, and ' +
      '`disabled` sets `aria-disabled` while detaching the composed interaction surface (onPress family ' +
      'plus mouse/focus handlers), exactly as Tamagui web does.',
    standIn:
      'Component unit tests in flex.test.tsx assert the click co-dispatch, the disabled detachment, and ' +
      'the aria-disabled attribute; disabledStyle CSS is diffed by the matrix under the `disabled` scope.',
  },
  {
    area: 'Native rendering props',
    reason:
      'Native-only hints (collapsable, removeClippedSubviews, hitSlop, …) have no web effect in ' +
      'Tamagui either; uniwind resolves classNames on native, which is the INFRA-2353 follow-up and ' +
      'not provable in this web harness.',
    standIn: 'Accepted-and-inert props, enumerated in the prop contract.',
  },
] as const
