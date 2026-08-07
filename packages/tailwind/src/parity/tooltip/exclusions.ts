/**
 * The explicit exclusions ledger for the tooltip compat (INFRA-3021):
 * everything about the legacy `ui/src` Tooltip surface the parity suite does
 * NOT prove equivalent, with the reason and the verification that stands in.
 * Nothing is silently skipped — anything not listed here is covered by the
 * type-level contract, the content-frame parity matrix, and the behavior
 * suite.
 */
import type { ParityExclusionEntry } from '../core/run-parity'

export const TOOLTIP_PARITY_EXCLUSIONS: readonly ParityExclusionEntry[] = [
  {
    area: 'Coexistence with the Radix components/tooltip.tsx (mycelium barrel)',
    reason:
      'mycelium already ships a shadcn-style Radix tooltip consumed by mission-control through the ' +
      'barrel — a production contract this track must not break. The compat therefore lives in its own ' +
      'tooltip-compat/ directory with a dedicated subpath export and targets ONLY the legacy shared ' +
      'Tooltip in packages/ui; unification is a later primitives-owner decision.',
    standIn:
      'The Radix tooltip.tsx is byte-untouched by this PR (no barrel or export-map changes besides the ' +
      'new ./tooltip-compat subpath); the same coexistence already holds for popover-compat and ' +
      'menu-compat next to the Radix popover/dropdown-menu scaffolding.',
  },
  {
    area: 'Hover timing semantics (Tamagui restMs vs Base UI fixed delay)',
    reason:
      'The legacy floating-ui pair (delay {open: 0, close: 500} + restMs 200) opens once the pointer ' +
      'RESTS 200ms; Base UI exposes a single fixed open delay per trigger, so a slowly-moving cursor ' +
      'opens the compat tooltip where the legacy one kept waiting for rest.',
    standIn:
      'mapTooltipDelay pins the mapping (restMs stands in for a zero open delay; delay.close maps to ' +
      'closeDelay) with unit tests over the ui/src defaults and the InfoTooltip call-site timings; the ' +
      'behavior suite proves open-on-hover/focus and delayed-close end to end.',
  },
  {
    area: 'Animation timing (Tamagui `simple` driver + enter/exit)',
    reason:
      'Legacy timing comes from the Tamagui animation driver at runtime; the compat expresses the same ' +
      '±4px directional fade via Base UI data-starting/ending-style transitions with a fixed 150ms ' +
      'ease-out.',
    standIn:
      'The direction algebra (animationDirection left/right/top/bottom → x/y ±4px, default top) is ' +
      'compiled into the popup classes and pinned by the class-compiler tests; timing configs are ' +
      'accepted-and-ignored exactly like the flex/text/popover compat animation contract.',
  },
  {
    area: 'Arrow rendering (Tamagui popper arrow internals)',
    reason:
      'The legacy arrow is a Tamagui popper-positioned rotated square whose offset math lives inside ' +
      '@tamagui/popper; Base UI positions its own arrow element, so the byte-level CSSOM diff cannot ' +
      'run against a live popper standalone. Every repo call site renders the arrow bare, with no ' +
      'style overrides, so overrides are accepted-inert.',
    standIn:
      'The compat arrow mirrors the styled defaults verbatim (12px square, surface1 fill, surface3 ' +
      'border, light-theme shadow, 45° rotation) through the same Flex compat compiler the matrix ' +
      'proves elsewhere, tucked per rendered side via data-side classes; the behavior suite asserts it ' +
      'renders inside the popup with exactly the compiled classes.',
  },
  {
    area: 'Trigger event long tail (RN press/hover plumbing on the trigger itself)',
    reason:
      'The legacy trigger is a full Tamagui stack, so the RN event surface (onPress family, pressStyle ' +
      'timing) type-leaks; tooltip triggers in the repo wrap interactive children and only pass layout ' +
      'style props (flex/width/position) plus asChild.',
    standIn:
      'The full surface is accepted with exact types (type-parity contract); style props compile ' +
      'through the proven Flex compat pools, onPress is wired to click, and asChild renders the child ' +
      'as the trigger element like Tamagui. The exotic RN handlers are accepted-inert.',
  },
  {
    area: 'Adapt-scope isolation (AdaptParent wrapper in the legacy TooltipBase)',
    reason:
      'The legacy web Tooltip wraps itself in an isolated Tamagui AdaptParent scope purely to stop a ' +
      'hosting modal/sheet Adapt context from capturing the tooltip content — a Tamagui-runtime hazard ' +
      'that does not exist on the Base UI engine (tooltips always portal).',
    standIn:
      'Base UI portals the popup unconditionally; the behavior suite renders the tooltip under an ' +
      'overlay host context and asserts the content portals with the correct stacking layer.',
  },
  {
    area: 'Content prop long tail (FocusScope/Dismissable hooks + ThemeableStack styled variants)',
    reason:
      'The legacy Tooltip.Content leaks the Popover.Content FocusScope/Dismissable surface ' +
      '(onOpenAutoFocus, onEscapeKeyDown, disableFocusScope, …) and the ThemeableStack variant ' +
      'shorthands (bordered, elevate, hoverTheme, …); no ui/src Tooltip.Content call site drives any of ' +
      'them (grep 2026-07-29), and Base UI tooltips never trap focus — matching the legacy default.',
    standIn:
      'The keys are accepted with the exact popover-compat types (PopoverContentFocusScopeCompatProps / ' +
      'PopoverContentStyledVariantProps) but inert on the tooltip; the type-parity contract fails if the ' +
      'legacy surface grows a key the compat does not list.',
  },
  {
    area: 'Tooltip groups and popper niceties (groupId, disableAutoCloseOnScroll, stayInFrame, resize)',
    reason:
      'No ui/src Tooltip consumer drives tooltip delay-groups or the popper scroll/resize middleware ' +
      'through this surface today; Base UI ships its own equivalents (TooltipProvider grouping, default ' +
      'collision handling) that the compat wires itself where behavior demands it. The scroll delta ' +
      'applies to EVERY call site, not just those passing disableAutoCloseOnScroll: the legacy tooltip ' +
      'auto-closes on document scroll by default (@tamagui/tooltip attaches a document scroll listener ' +
      'unless the flag is set), while the compat/Base UI popup stays open and repositions with its anchor.',
    standIn:
      'Props are accepted with exact types and enumerated as inert in tooltip-compat/props.ts; the ' +
      'type-parity contract fails if the legacy surface grows a key the compat does not list.',
  },
] as const
