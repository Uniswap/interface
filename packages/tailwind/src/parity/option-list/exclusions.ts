/**
 * The explicit exclusions ledger for the option-list compat (INFRA-3021
 * dropdown set): everything about the legacy NetworkFilterV2 dropdown-content
 * surface (`NetworkFilterDropdownContent` / `NetworkFilterContent` /
 * `NetworkOption` / `NetworkSearchBar`) the parity suites do NOT prove
 * byte-identical, with the reason and the verification that stands in.
 * Nothing is silently skipped — anything not listed here is either diffed per
 * scope by the matrices or asserted by the behavior/type contracts.
 */
import type { ParityExclusionEntry } from '../core/run-parity'

export const OPTION_LIST_PARITY_EXCLUSIONS: readonly ParityExclusionEntry[] = [
  {
    area: 'TouchableArea row wrapper (press feedback, animation driver plumbing)',
    reason:
      'The legacy selectable row is NetworkOption wrapped in a `TouchableArea hoverable` — an animated ' +
      'Tamagui component that inlines styles and attaches animation-driver props at runtime. The compat ' +
      'row is a single element carrying the NetworkOption frame styles plus cursor/user-select.',
    standIn:
      'The row-frame matrix diffs the NetworkOption inner Flex (where all the visual vocabulary lives) ' +
      'verbatim; the interaction surface (click dispatch, disabled detachment, propagation stopping) is ' +
      'pinned by the behavior suite, mirroring the menu-compat item approach.',
  },
  {
    area: 'Search input chrome (SearchTextInput internals)',
    reason:
      'The legacy NetworkSearchBar delegates to `uniswap/src/features/search/SearchTextInput` — a ' +
      '250-line animated component (focus animations, cancel button, clear affordance, RN TextInput) ' +
      'whose full surface is out of the dropdown-set scope. The compat renders a plain input with the ' +
      'same box chrome (surface2 fill, 1px surface3 border, rounded16, body1 metrics, neutral2 ' +
      'placeholder, search glyph).',
    standIn:
      'The behavior suite pins the input contract (placeholder, autoFocus-unless-sheet, controlled ' +
      'query, clear-on-close); the chrome classes are CSS-existence-tested. Byte-level SearchTextInput ' +
      'parity belongs to the input-family migration track.',
  },
  {
    area: 'Chain metadata, logos, and pills (NetworkLogo / NetworkPile / NewTag / getChainInfo)',
    reason:
      'Chain display data and image assets live in packages/uniswap, which mycelium must not depend on ' +
      '(package-graph inversion). The compat renders host-provided ReactNode slots (logo, logoPile, ' +
      'badge) instead of resolving chains itself.',
    standIn:
      'The behavior suite asserts the slots render in the legacy positions (leading logo, badge after ' +
      'label, trailing checkmark); conversion facades pass NetworkLogo/NetworkPile/NewTag exactly as ' +
      'the legacy components construct them, so pixels are owned by the same unchanged components.',
  },
  {
    area: 'i18n strings (search placeholder, All networks, tier titles, empty state)',
    reason:
      'The legacy content translates via uniswap/src/i18n (t("common.input.search.networks"), ' +
      '"transaction.network.all", "network.filter.withBalances", NoResultsFound). Mycelium has no i18n ' +
      'runtime; strings are host-injected props with English defaults matching the en catalog.',
    standIn:
      'The behavior suite pins the label plumbing (custom labels land verbatim, defaults match the en ' +
      'strings); conversion facades pass the translated strings from the same keys.',
  },
  {
    area: 'HeightAnimator around the filtered list',
    reason:
      'The legacy non-fill dropdown animates list height on filter via ui/src HeightAnimator (Tamagui ' +
      'animation driver). The compat list resizes instantly; sizing correctness is owned by the ' +
      'positioner-driven max-height instead.',
    standIn:
      'Documented as an animation-timing delta like the menu-compat animation exclusion; the ' +
      'fill/scroll layout contract itself is pinned by the behavior suite.',
  },
  {
    area: 'Sticky-header anchoring + bottom scroll fade — DESIGN-REQUESTED DEVIATIONS',
    reason:
      'The 2026-07 design review changed two scroll-chrome behaviors from the legacy pixels: (1) when ' +
      'sticky tier headers render, the search input drops its 8px bottom padding so the pinned header ' +
      'anchors flush beneath it — the header itself (surface1 padding) provides the spacing and paints ' +
      'over rows scrolling beneath (the legacy layout left a see-through gap); (2) a 24px overlay at ' +
      'the bottom of the scrollable list fades from surface1 to surface1 at 0% opacity and is removed ' +
      'the moment the list is scrolled to its end. Deliberate deltas, requested by design.',
    standIn:
      'The behavior suite pins both: the pb-0 input wrapper with titled sticky sections (and the legacy ' +
      'padding for flat/sheet lists), the single-scroller structure the headers pin to, and the fade ' +
      'show/hide-at-end lifecycle; the fade classes are CSS-existence-tested.',
  },
  {
    area: 'Keyboard navigation / ARIA roles — INTENTIONAL A11Y UPGRADE',
    reason:
      'The legacy rows are TouchableArea/Flex with no keyboard support and no list semantics. The ' +
      'compat implements the WAI-ARIA combobox/listbox pattern (arrow keys, Home/End, Enter, ' +
      'aria-activedescendant, role=option/listbox/combobox) — a deliberate upgrade, not drift. ' +
      'DOM-shape-sensitive tests (snapshots, e2e selectors) will see the difference.',
    standIn:
      'The behavior suite pins the new contract; the delta is called out in the INFRA-3021 PR body for ' +
      'the conversion-sweep owners.',
  },
] as const
