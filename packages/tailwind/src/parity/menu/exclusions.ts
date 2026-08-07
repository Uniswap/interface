/**
 * The explicit exclusions ledger for the menu-family compat (INFRA-3021):
 * everything about the legacy ContextMenu / MenuContent /
 * DropdownMenuSheetItem surface the parity suites do NOT prove byte-identical,
 * with the reason and the verification that stands in. Nothing is silently
 * skipped — anything not listed here is either diffed per scope by the
 * matrices or asserted by the behavior/type contracts.
 */
import type { ParityExclusionEntry } from '../core/run-parity'

export const MENU_PARITY_EXCLUSIONS: readonly ParityExclusionEntry[] = [
  {
    area: 'adaptToSheet / mWeb bottom-sheet leg — GATED DEFERRAL',
    reason:
      'The small-viewport bottom-sheet presentation depends on the Sheet/Dialog migration track; until ' +
      'it lands the compat menu renders the popover presentation at every viewport. adaptToSheet and ' +
      'the sheet container styles are accepted with exact types so call sites keep compiling.',
    standIn:
      'Type-parity pins the prop surface; the behavior suite asserts the popover renders with ' +
      'adaptToSheet set; the sheet container styling itself IS byte-diffed by the container matrix ' +
      '(MENU_CONTENT_SHEET_CONTAINER_STYLES case). Flagged prominently in the INFRA-3021 PR body.',
  },
  {
    area: 'Analytics emission (useContextMenuTracking / ContextMenuItemClicked)',
    reason:
      'Telemetry lives in packages/uniswap and cannot be imported by mycelium without inverting the ' +
      'package graph. elementName/sectionName/trackItemClicks are accepted with exact (string) types; ' +
      'emission is host-injected through the telemetryAdapter seam at conversion time.',
    standIn:
      'The behavior suite asserts the telemetryAdapter receives opened/closed/item-clicked callbacks ' +
      'with the same payloads the legacy tracking hook derives, so the conversion facade can forward ' +
      'them 1:1 to sendAnalyticsEvent.',
  },
  {
    area: 'Keyboard navigation / ARIA roles — INTENTIONAL A11Y UPGRADE',
    reason:
      'The legacy web menu has NO keyboard support and renders items with role="none"; Base UI Menu ' +
      'adds arrow-key navigation, typeahead, and menu/menuitem roles. This is a deliberate upgrade, ' +
      'not drift — but DOM-shape-sensitive tests (snapshots, e2e selectors) will see the difference.',
    standIn:
      'The behavior suite pins the new contract (menuitem roles present, Escape requests close); the ' +
      'delta is called out in the INFRA-3021 PR body for the conversion-sweep owners.',
  },
  {
    area: 'Animation timing (Tamagui quick driver, position-change remount)',
    reason:
      'Legacy enter/exit timing comes from the Tamagui animation driver and a key-remount per ' +
      'right-click position; the compat expresses the same ±10px fade via Base UI ' +
      'data-starting/ending-style transitions with a fixed 150ms ease-out.',
    standIn:
      'Direction algebra is compiled into the popup classes and unit-asserted; timing configs are ' +
      'accepted-and-ignored exactly like the flex/text compat animation contract.',
  },
  {
    area: 'Scroll lock while a menu is open (RemoveScroll blockScrollEvents)',
    reason:
      'The legacy web-app menu blocks page scroll through tamagui RemoveScroll with shards, gated on ' +
      'isWebApp (an @universe/environment check mycelium must not depend on — it pulls react-native). ' +
      'The compat blocks wheel/touchmove outside the open menu itself.',
    standIn:
      'The behavior suite asserts wheel events outside the open menu are cancelled and inside ones ' +
      'pass, and that `blockOutsideScroll: false` disables the blocking entirely — the compat-only ' +
      'prop through which conversion facades apply the legacy isWebApp gate (extension facades pass ' +
      'false; default true = web-app behavior).',
  },
  {
    area: 'Menu separator geometry (0-height flex line vs full-width bordered div)',
    reason:
      'The legacy <Separator my="$spacing6" /> is a Tamagui Stack: flex:1 with height/max-height 0 and ' +
      'a 1px bottom border, stretched by the column card. The compat renders a plain full-width div ' +
      'with the same 6px margins and bottom border — inside the column menu card both paint the ' +
      'identical 1px $surface3 line; only the inert flex/height box-model declarations differ.',
    standIn:
      'The separator parity matrix (menu-separator.test.tsx) byte-diffs the two per theme and pins ' +
      'every geometry delta explicitly (SEPARATOR_GEOMETRY_PINS in expectations.ts), so any change ' +
      'that could affect the painted line surfaces as a failing diff; the border color rides the ' +
      'shared palette-drift ledger.',
  },
  {
    area: 'Native menu leg (dimBackground scrim, onPressAny, FullWindowOverlay hoisting)',
    reason:
      'dimBackground and onPressAny are native-only behaviors today (the legacy WEB implementation ' +
      'already ignores both); the native compat leg is deferred per INFRA-3021.',
    standIn:
      'Props accepted with exact types and inert — matching the legacy web behavior byte-for-byte; ' +
      'menu-compat/index.native.ts throws so accidental native use fails loudly.',
  },
  {
    area: 'TouchableArea press-state animation plumbing on the item frame',
    reason:
      'The legacy item frame is a TouchableArea, which attaches Tamagui animation driver props ' +
      "(animation='simple', animateOnly) outside test environments and re-emits hover colors onto " +
      'children via runtime cloning. The compat item styles hover/press purely in CSS.',
    standIn:
      'The frame matrix diffs the full CSSOM of the real DropdownMenuSheetItem root (rendered in the ' +
      'same test-env branch Tamagui itself uses) per scope; the hover color shift on the label is ' +
      'covered by the label matrix group-hover scope.',
  },
  {
    area: 'RTL row-reversal (I18nManager.isRTL)',
    reason:
      'The legacy item reads react-native I18nManager.isRTL, which is statically false on web unless ' +
      'the app opts in (no Uniswap web surface does); replicating the RN flag in mycelium would wire a ' +
      'react-native dependency into the Tailwind package graph.',
    standIn:
      'The compat renders the LTR row exactly like every production web surface today; RTL support is ' +
      'a documented follow-up for the conversion sweep (CSS logical properties).',
  },
] as const
