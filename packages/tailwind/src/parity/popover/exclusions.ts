/**
 * The explicit exclusions ledger for the popover compat (INFRA-3021):
 * everything about the legacy `AdaptiveWebPopoverContent` surface the parity
 * suite does NOT prove equivalent, with the reason and the verification that
 * stands in. Nothing is silently skipped — anything not listed here is
 * covered by the type-level contract and the behavior suite.
 */
import type { ParityExclusionEntry } from '../core/run-parity'

export const POPOVER_PARITY_EXCLUSIONS: readonly ParityExclusionEntry[] = [
  {
    area: 'Sheet adaptation (isSheet / adaptWhen / webBottomSheetProps) — GATED DEFERRAL',
    reason:
      'The mWeb bottom-sheet leg depends on the Sheet/Dialog migration track (Base UI Drawer) which has ' +
      'not landed; shipping a second sheet implementation now would fork the modal z-index machinery. ' +
      'The compat therefore renders the popover presentation regardless of viewport for now.',
    standIn:
      'The full legacy prop surface is accepted: webBottomSheetProps replicates the web ModalProps of ' +
      'AdaptiveWebModal.tsx (the leaked View style surface via the Flex compat contract + the explicit ' +
      'web-sheet knobs), pinned by a nested key-coverage check and the live call-site fragments in the ' +
      'type-parity contract; the behavior suite asserts the popover still renders when isSheet is ' +
      'forced. Tracked prominently in the INFRA-3021 PR body.',
  },
  {
    area: 'Animation timing (Tamagui `quick` driver + enter/exit remount)',
    reason:
      'Legacy timing comes from the Tamagui animation driver at runtime; the compat expresses the same ' +
      '±10px fade via Base UI data-starting/ending-style transitions with a fixed 150ms ease-out.',
    standIn:
      'The direction algebra (above-trigger animates from below, otherwise from above) is compiled into ' +
      'the popup classes and asserted by the class-compiler test; timing configs are accepted-and-ignored ' +
      'exactly like the flex/text compat animation contract.',
  },
  {
    area: 'Popup frame default styling (PopperContentFrame variants)',
    reason:
      'Tamagui Popover.Content ships styled defaults (size $true → 8px padding + 0 radius, ' +
      'backgroundColor $background → surface1, alignItems center) resolved through the Tamagui theme at ' +
      'runtime; a byte-level CSSOM diff of the popper frame requires an open Tamagui popover root, which ' +
      'the extraction harness cannot host standalone.',
    standIn:
      'The defaults are mirrored from the installed @tamagui/popper source into the compat compiler and ' +
      'the behavior suite asserts the popup renders exactly the compiled classes; the menu family (the ' +
      'first consumer) overrides the frame to transparent, and THAT surface is byte-diffed by the menu ' +
      'parity matrices.',
  },
  {
    area: 'Focus management (FocusScope mapping onto Base UI initialFocus/finalFocus)',
    reason:
      'Legacy popovers neither move focus into the popup on open nor restore it on close by DEFAULT ' +
      '(Tamagui trapFocus defaults off), but production call sites drive the FocusScope hooks: ' +
      'RecentlyConnectedModal focuses its login button from onOpenAutoFocus, SendRecipientForm and ' +
      'BalanceBreakdownPopover suppress focus stealing (onOpenAutoFocus preventDefault, ' +
      'onCloseAutoFocus false, disableFocusScope). Base UI has no FocusScope events — it takes ' +
      'initialFocus/finalFocus values.',
    standIn:
      'WIRED, not inert: with no callbacks the compat keeps the no-focus-move default; a provided ' +
      'onOpenAutoFocus/onCloseAutoFocus runs with a cancelable event and its preventDefault (or ' +
      'onCloseAutoFocus: false / disableFocusScope) returns false to Base UI, otherwise the default ' +
      'focus move runs. The behavior suite pins all three call-site patterns; trapFocus stays ' +
      'accepted-inert.',
  },
  {
    area: 'Dismissal interceptors (onEscapeKeyDown / onPointerDownOutside / onFocusOutside / onInteractOutside)',
    reason:
      'The legacy Dismissable fires cancelable events BEFORE dismissing; Base UI reports close requests ' +
      'through onOpenChange(reason). The compat root runs the registered interceptors on ' +
      'escape-key/outside-press/focus-out requests and a preventDefault swallows the request (plus ' +
      'details.cancel() for uncontrolled roots). The synthetic events carry the legacy shapes ' +
      '(cancelable KeyboardEvent; CustomEvent with detail.originalEvent) but are NOT the identical ' +
      'object instances the Tamagui Dismissable dispatched.',
    standIn:
      'The behavior suite asserts each interceptor fires with the right event shape and that ' +
      'preventDefault blocks the close request while unprevented requests still close. No production ' +
      'AdaptiveWebPopoverContent call site uses these today (grep 2026-07-27) — the wiring exists so ' +
      'converted sites keep their contract.',
  },
  {
    area: 'Styled variant shorthands (bordered/circular/hoverTheme/pressTheme/focusTheme/elevate/elevation/transparent/padded/radiused/fullscreen)',
    reason:
      'Tamagui ThemeableStack variant shorthands leak through Popover.Content. They resolve through the ' +
      'Tamagui theme/size systems at runtime; the compat styling goes through explicit style props ' +
      "instead. The only production call site is CreateNewTokenForm's `elevate` (a drop shadow).",
    standIn:
      'Accepted with the legacy value types and inert (enumerated in PopoverContentStyledVariantProps + ' +
      "the compiler's non-style key list); the type contract pins the surface and the elevate call site " +
      'is named for the conversion sweep — its shadow moves to explicit shadow props, like the other ' +
      'popover consumers already pass.',
  },
  {
    area: 'Hover-open popovers (`hoverable`) and Tamagui popper internals',
    reason:
      'No AdaptiveWebPopoverContent consumer drives hoverable popovers through this surface today; the ' +
      'remaining Tamagui plumbing (scope composition, arrow props, lazy-mount knobs) has Base UI ' +
      'equivalents the compat wires itself.',
    standIn:
      'Props are accepted with exact types and enumerated as inert in popover-compat/props.ts; the ' +
      'type-parity contract fails if the legacy surface grows a key the compat does not list.',
  },
] as const
