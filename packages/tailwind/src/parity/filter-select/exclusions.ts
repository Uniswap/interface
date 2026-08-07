/**
 * The explicit exclusions ledger for the filter-select compat (INFRA-3021
 * dropdown set): everything about the legacy web `DropdownSelector` /
 * `Dropdown` / `AdaptiveDropdown` surface the parity suites do NOT prove
 * byte-identical, with the reason and the verification that stands in.
 */
import type { ParityExclusionEntry } from '../core/run-parity'

export const FILTER_SELECT_PARITY_EXCLUSIONS: readonly ParityExclusionEntry[] = [
  {
    area: 'adaptToSheet / mWeb bottom-sheet leg — GATED DEFERRAL',
    reason:
      'The legacy AdaptiveDropdown adapts into a WebBottomSheet at its adaptWhen breakpoint. The sheet ' +
      'presentation depends on the Sheet/Dialog migration track; until it lands the compat renders the ' +
      'menu presentation at every viewport. adaptToSheet is accepted with the exact legacy type so ' +
      'call sites keep compiling.',
    standIn:
      'Type-parity pins the prop surface; the behavior suite asserts the menu renders with adaptToSheet ' +
      'set. Flagged prominently in the INFRA-3021 PR body, same as the menu-compat deferral.',
  },
  {
    area: 'Positioning plumbing (positionFixed body portal, forceFlipUp, alignRight, dropdownLayoutUtils)',
    reason:
      'The legacy dropdown hand-rolls flip/clamp math (dropdownLayoutUtils, useFixedDropdownLayout) and ' +
      'offers positionFixed to escape clipped parents. The compat always portals and delegates ' +
      'flip/shift/size to the Base UI positioner, so positionFixed is accepted-inert (every popup ' +
      'already escapes clipping) and forceFlipUp/alignRight map to positioner side/align preferences ' +
      'refined by collision avoidance rather than absolute commands.',
    standIn:
      'The behavior suite pins the mapping (top side requested under forceFlipUp, end alignment under ' +
      'alignRight) and that opening attaches no scroll/resize clamp listeners; real-viewport collision ' +
      'behavior is demonstrated by the workbench constrained-container demo.',
  },
  {
    area: 'tooltipText trigger tooltip (MouseoverTooltip)',
    reason:
      'The legacy Dropdown wraps its trigger in apps/web MouseoverTooltip — the react-popper + ' +
      '@reach/portal legacy stack, which is a separate migration track. Wiring it here would couple ' +
      'the dropdown set to the component the set exists to retire.',
    standIn:
      'tooltipText is rendered as title + aria-label on the trigger (native browser tooltip) until the ' +
      'tooltip compat (#36951) lands; the behavior suite pins the attribute plumbing.',
  },
  {
    area: 'InternalMenuItem / trigger chrome byte-parity',
    reason:
      'The legacy InternalMenuItem and TriggerButton are styled(Text) components in apps/web whose ' +
      'transitive import graph (AdaptiveDropdown → MouseoverTooltip → react-popper, web hooks) cannot ' +
      'load in the parity harness without dragging the whole web app in. The compat mirrors their ' +
      'style payloads as literal Tailwind classes instead of a rendered byte-diff.',
    standIn:
      'The chrome classes are CSS-existence-tested (dropdown-set classes suite) and reviewed against ' +
      'the styled() definitions copied verbatim into the compat compile source; the option-row/section ' +
      'matrices cover the shared row grammar byte-level. Documented follow-up: bind a matrix once the ' +
      'legacy pieces are extracted from the web-app graph.',
  },
  {
    area: 'Item hover paint, label weight, and the selected checkmark — DESIGN-REQUESTED DEVIATIONS',
    reason:
      'The 2026-07 design review normalized the dropdown vocabulary against the network selector: item ' +
      'hover/highlight paints $surface2 (legacy InternalMenuItem used $surface3), trigger + option ' +
      'labels use normal weight body3 (legacy buttonLabel3 medium; medium stays on Select all / Clear), ' +
      'and the selected marker is the filled CheckmarkCircle glyph in $neutral1 across single- AND ' +
      'multi-select (legacy: accent1 stroke check / sandbox checkbox square). Deliberate deltas from ' +
      'the legacy pixels, requested by design.',
    standIn:
      'The deviated values ship as the literal compat classes (CSS-existence-tested in the dropdown-set ' +
      'classes suite) with DELIBERATE DEVIATION notes at each constant in filter-select-compat/compile.ts; ' +
      'the behavior suite pins the shared check slot and menuitemcheckbox semantics.',
  },
  {
    area: 'Close-time focus return (finalFocus={false})',
    reason:
      'The legacy AdaptiveDropdown performs no focus management at all — focus never moves into the ' +
      'dropdown and nothing is restored to the trigger on close. Base UI Menu would move focus back to ' +
      'the trigger by default, which legacy never did, so the compat pins finalFocus={false} to keep ' +
      'the legacy close-time focus behavior (same call as the menu-compat ContextMenu).',
    standIn:
      'Documented at the finalFocus={false} sites in FilterSelectCompat/FilterSelectMultiCompat. ' +
      'Restoring focus to the trigger on close is queued with the a11y upgrade sweep alongside the ' +
      'roving-tabindex items the compat already gained for free.',
  },
  {
    area: 'Scroll-lock / outside-click microbehavior (ignoredNodes, ignoreDialogClicks)',
    reason:
      'The legacy AdaptiveDropdown wires useOnClickOutside with ignoredNodes/ignoreDialogClicks and ' +
      'VisuallyHidden focus plumbing. The compat delegates dismissal to Base UI Menu (outside press + ' +
      'Escape request close through toggleOpen), which covers every production call-site pattern; ' +
      'ignoredNodes/ignoreDialogClicks are accepted-inert for drop-in compatibility.',
    standIn:
      'The behavior suite asserts outside-press and Escape request close via toggleOpen(false) while ' +
      'the component stays fully controlled; call sites needing bespoke ignore lists are flagged at ' +
      'conversion time.',
  },
] as const
