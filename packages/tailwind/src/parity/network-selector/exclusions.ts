/**
 * The explicit exclusions ledger for the network-selector compat (INFRA-3021
 * dropdown set): everything about the legacy `NetworkFilterV2`
 * (`uniswap/src/components/network/NetworkFilterV2/NetworkFilterV2.web.tsx`)
 * the parity suites do NOT prove byte-identical, with the reason and the
 * verification that stands in. The option-list ledger covers the
 * dropdown-content pieces (rows, search input, chain metadata slots, i18n,
 * HeightAnimator, the a11y upgrade); this ledger covers the selector shell.
 */
import type { ParityExclusionEntry } from '../core/run-parity'

export const NETWORK_SELECTOR_PARITY_EXCLUSIONS: readonly ParityExclusionEntry[] = [
  {
    area: 'Mobile-web bottom-sheet leg — GATED DEFERRAL',
    reason:
      'The legacy selector adapts into a WebBottomSheet at media.sm with snapPoints [60] percent. The ' +
      'sheet presentation depends on the Sheet/Dialog migration track; until it lands the compat ' +
      'renders the popover presentation at every viewport. The webBottomSheetProps payload (onClose, ' +
      'snapPoints, snapPointsMode) is passed through with exact types so the sheet leg lights up ' +
      'without call-site changes when the track lands.',
    standIn:
      'Type-parity pins the prop surface; the behavior suite asserts the popover renders regardless; ' +
      'the isSheet seam suppresses autoFocus exactly like the legacy sheet branch. Flagged prominently ' +
      'in the INFRA-3021 PR body.',
  },
  {
    area: 'Viewport clamping engine — INTENTIONAL REPLACEMENT (the #36826 bug class)',
    reason:
      'Constraint: the open side and available size must come from real collision avoidance against ' +
      'the measured viewport, never from a breakpoint literal or a hand-rolled clamp — the legacy ' +
      "stack's breakpoint-guessed positioning has shipped this bug class repeatedly (#35471, #36722 " +
      'landed; #36826 still open for the same overflow). The compat delegates flip/shift/size to the ' +
      'Base UI positioner and clamps the list with the positioner-provided --available-height ' +
      'variable, replacing the legacy getViewportConstrainedMaxHeight scroll/resize listeners.',
    standIn:
      'The behavior suite asserts the compat sources hand-roll no viewport measurement or breakpoint ' +
      'logic (the positioner owns scroll/resize tracking) and that the list carries the ' +
      '--available-height clamp; real-viewport collision behavior is demonstrated by the workbench ' +
      'constrained-container demo (jsdom has no layout engine to prove it in unit tests).',
  },
  {
    area: 'Analytics emission (Trace modal=NetworkSelector, NetworkFilterSelected fields)',
    reason:
      'Telemetry lives in packages/uniswap and cannot be imported by mycelium without inverting the ' +
      'package graph. Emission is host-injected through the telemetryAdapter seam at conversion time, ' +
      'mirroring the menu-compat MenuTelemetryAdapter pattern.',
    standIn:
      'The behavior suite asserts the adapter receives opened/closed/network-selected callbacks with ' +
      'chainId + previousChainId, so the conversion facade can forward 1:1 to sendAnalyticsEvent / ' +
      'buildNetworkFilterSelectedChainFields and wrap the content in Trace itself.',
  },
  {
    area: 'Trigger hover tooltip naming the selected chain',
    reason:
      'The legacy trigger wraps the network logo in a ui/src Tooltip on non-touch devices. The tooltip ' +
      'compat ships on the INFRA-3021 tooltip branch (#36951) and is not part of this stack; wiring a ' +
      'second overlay engine here would race that migration.',
    standIn:
      'The compat renders the tooltip label as title + aria-label on the trigger (native browser ' +
      'tooltip) until the tooltip compat lands; the behavior suite pins the attribute plumbing. ' +
      'Documented follow-up: compose TooltipCompat once #36951 merges.',
  },
  {
    area: 'defaultChainId resolution (useEnabledChains)',
    reason:
      'The legacy selector reads defaultChainId from useEnabledChains (redux + feature gating in ' +
      'packages/uniswap). The compat accepts it as a prop seam instead.',
    standIn:
      'The behavior suite pins the displayed-chain arithmetic (selectedChain ?? (includeAllNetworks ? ' +
      'null : defaultChainId)); conversion facades pass useEnabledChains().defaultChainId.',
  },
] as const
