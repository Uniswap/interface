/**
 * The explicit exclusions ledger: everything about the Tamagui TouchableArea
 * surface the parity suite does NOT prove byte-identical, with the reason and
 * the verification that stands in. Nothing is silently skipped — anything not
 * listed here is either diffed per scope by the matrix or fails the suite.
 */

export interface ParityExclusion {
  area: string
  reason: string
  standIn: string
}

export const PARITY_EXCLUSIONS: readonly ParityExclusion[] = [
  {
    area: 'Default animation driver (`animation="simple"` + `animateOnly`)',
    reason:
      'Outside test environments the legacy TouchableArea always mounts with `animation="simple"` and ' +
      '`animateOnly={["transform","opacity"]}`, which hands transform/opacity to the Tamagui animation ' +
      'driver at runtime (inline styles, driver timing) instead of static CSS. The harness therefore ' +
      'renders the legacy side with `animation={null}` — a supported call-site value the component ' +
      'special-cases — so both sides emit their static CSS surface. The compat component renders the ' +
      'same states as instant CSS transitions; driver timing/easing is not replicated.',
    standIn:
      'Every interactive pool (press scale/opacity, hover, focus-visible) is diffed as CSS per scope; ' +
      'the `animation`/`animateOnly` props are accepted and their timing configs ignored, same as the ' +
      'Flex ledger pins for animation timing.',
  },
  {
    area: 'Enter/exit animation presets (animateEnter / animateExit / animateEnterExit)',
    reason:
      'The legacy TouchableArea has no preset surface — those are Flex styled-variants. The compat ' +
      'contract still accepts the shared preset props (they come with the compat core, useful when a ' +
      'call site migrates from a Flex-based touchable), but there is no legacy CSS to diff them against ' +
      'on this component.',
    standIn:
      'The preset mechanics (keyframe endpoints, `[data-exiting]` exit gating) are proven by the Flex ' +
      'binding of this same suite; matrix rows here prove the accepted-and-ignored `animation`/' +
      '`animateOnly` driver props contribute zero CSS.',
  },
  {
    area: 'Auto hit-slop and minimum touch-target measurement',
    reason:
      'The legacy component measures itself (`useAutoHitSlop`, `useAutoDimensions`) and computes RN ' +
      '`hitSlop` insets / minimum width+height at runtime from layout events. `hitSlop` has no web ' +
      'rendering in Tamagui (native-only touch expansion), and the minimum-dimension state depends on ' +
      'live layout, which a static CSS diff cannot observe.',
    standIn:
      'Matrix rows prove `hitSlop` and `shouldConsiderMinimumDimensions` contribute zero CSS on web; ' +
      'the compat component replicates the minimum-dimension resize behavior via its ResizeObserver ' +
      'layout path, covered by component unit tests. Native hit-slop wiring is the `.native.tsx` ' +
      'Pressable split (full native style parity is INFRA-2353).',
  },
  {
    area: 'Press event runtime wiring (stopPropagation, onPress family, disabled gating)',
    reason:
      'Event dispatch is runtime behavior a CSS diff cannot prove. The compat mirrors the legacy web ' +
      'wiring: press → click, pressIn/Out → pointer down/up, `shouldStopPropagation` (default true) ' +
      'stopping propagation before dispatch, and `disabled` setting `aria-disabled`/`tabindex=-1` while ' +
      'detaching the composed interaction surface.',
    standIn:
      'Component unit tests in touchable-area.test.tsx assert propagation gating, disabled detachment, ' +
      'tabindex/role/aria attributes; disabled/pressed CSS pools are diffed by the matrix.',
  },
  {
    area: 'Modifier-press navigation semantics',
    reason:
      'With `modifierPressHref` the legacy component renders an `<a>` and gates navigation at runtime: ' +
      'plain click calls preventDefault + onPress, modifier click (meta/ctrl/shift/middle) falls through ' +
      'to native navigation and calls onModifierPress. Runtime navigation behavior is not CSS-provable.',
    standIn:
      'Matrix rows prove the `<a>`-mode CSS additions (text-decoration reset, inherited color); unit ' +
      'tests assert the tag/role/href attributes and the modifier-click dispatch split.',
  },
  {
    area: 'Automatic child color injection (`shouldAutomaticallyInjectColors`)',
    reason:
      'The legacy component clones its children on web, injecting `color`/`backgroundColor`/' +
      '`$group-hover` hover-token props per Spore guidelines. That mutates children, not the touchable ' +
      'element this suite diffs.',
    standIn:
      'The compat replicates the cloning contract (default color $accent3, hovered-token lookup against ' +
      'the pinned legacy token table, disabled overrides); unit tests assert the injected child props.',
  },
  {
    area: 'Floating variant native BlurView',
    reason:
      'On native mobile the floating variant renders an expo-blur BlurView underlay; web uses the CSS ' +
      'backdrop-filter the matrix already diffs. Native rendering is INFRA-2353.',
    standIn: 'The web `backdrop-filter: blur(12px)` declarations are diffed by the floating variant rows.',
  },
  {
    area: 'Group container containment declarations',
    reason:
      'The legacy frame is always a Tamagui group (`group: true`), declaring `container-name: true` plus ' +
      '`container-type` (`normal` on web via its `$platform-web` override). Unlike Flex — where the ' +
      'implied `inline-size` containment would change layout and is pinned as a diff — `normal` has no ' +
      'layout effect, so the compat emits the same inert declarations and the group marker class.',
    standIn: 'Byte-identical `container-name`/`container-type` declarations diffed on every matrix row.',
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
      'Same accept-and-ignore contract as Flex: the deprecated trio would couple the compat to Tamagui ' +
      'child-injection internals; spacing must be expressed via `gap` when a call site migrates.',
    standIn: 'Type-level acceptance in the prop contract; the gap pools are covered by the matrix.',
  },
  {
    area: 'Native rendering props',
    reason:
      'Native-only hints (collapsable, removeClippedSubviews, ignoreDragEvents, …) have no web effect ' +
      'in Tamagui either; uniwind resolves classNames on native, which is the INFRA-2353 follow-up and ' +
      'not provable in this web harness.',
    standIn:
      'Accepted-and-inert props, enumerated in the prop contract; native tests are written skipped, annotated INFRA-2353.',
  },
] as const
