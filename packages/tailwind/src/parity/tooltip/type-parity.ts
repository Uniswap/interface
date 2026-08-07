/**
 * Type-level drop-in contract for the Base-UI-backed tooltip compat
 * (INFRA-3021): every prop accepted by the legacy `ui/src` Tooltip surface
 * (`packages/ui/src/components/tooltip/Tooltip.tsx` — the root Tamagui
 * `TooltipProps`, the stack-typed Trigger, the `TooltipContentProps` content,
 * and the styled popper Arrow) is either covered by the tooltip-compat
 * contracts or listed in the explicit exclusion unions below.
 *
 * Compiled by `tsconfig.type-parity.json` (driven from
 * `type-parity.test.ts`). A newly uncovered key fails the build with the key
 * names in the error message.
 */
import type { ComponentProps } from 'react'
import type { Tooltip } from 'ui/src'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import type {
  TooltipArrowCompatProps,
  TooltipCompatProps,
  TooltipCompatTriggerProps,
  TooltipContentCompatProps,
} from '../../../../mycelium/src/tooltip-compat/props'
import type { SharedExcludedKey } from '../core/type-exclusions'

type LegacyRootProps = ComponentProps<typeof Tooltip>
type LegacyTriggerProps = ComponentProps<typeof Tooltip.Trigger>
type LegacyContentProps = ComponentProps<typeof Tooltip.Content>
type LegacyArrowProps = ComponentProps<typeof Tooltip.Arrow>

/**
 * Tamagui composition/scoping plumbing with no Base UI counterpart (the
 * compat wires its own scoping): documented in the tooltip parity exclusions
 * ledger.
 */
type TamaguiTooltipPlumbingKey = 'scope' | '__scopePopper' | '__scopePopover'

/**
 * Raw enterStyle/exitStyle objects: arbitrary per-call-site enter/exit styles
 * would require runtime keyframe generation; the compat tooltip carries the
 * legacy component's own animationDirection-driven fade/slide as
 * data-starting/ending-style transitions instead. See the exclusions ledger.
 */
type RawPresenceStyleKey = 'enterStyle' | 'exitStyle'

/**
 * Tamagui popper-arrow extras the compat accepts through its own defaults
 * (the arrow is rendered bare at every repo call site; see the ledger).
 * `children` and the ThemeableStack variant leak (`elevation`, `fullscreen`)
 * are excluded deliberately: the compat arrow renders its own inner element,
 * so silently dropping children would be a footgun.
 */
type TamaguiArrowPlumbingKey = 'offset' | 'size' | 'unstyled' | 'inset' | 'children' | 'elevation' | 'fullscreen'

/**
 * React-reserved plumbing: `key` never reaches the component; `ref` is
 * covered behaviorally (each compat part is a forwardRef component) — it
 * materializes in the legacy `ComponentProps<...>` only because the legacy
 * components are typed through forwardRef, while the compat contracts are
 * plain props types.
 */
type ReactPlumbingKey = 'key' | 'ref'

/**
 * Compile-time-only assert: instantiating it with a non-never union fails
 * with the offending key names in the constraint error. Replaces the
 * `Record<never, never>` value-assignment form, which is VACUOUS (any object
 * is assignable to `{}`) — verified by deliberate contract breaks; same fix
 * the popover contract (#36933) applies.
 */
type AssertNoUncoveredKeys<T extends never> = T

// ── Root ────────────────────────────────────────────────────────────────

type UncoveredRootKeys = Exclude<
  keyof LegacyRootProps,
  keyof TooltipCompatProps | SharedExcludedKey<LegacyRootProps, TooltipCompatProps> | TamaguiTooltipPlumbingKey
>
/** Fails listing the uncovered keys whenever root coverage regresses. */
export type TooltipRootPropsFullyCovered = AssertNoUncoveredKeys<UncoveredRootKeys>

// ── Trigger ─────────────────────────────────────────────────────────────

type UncoveredTriggerKeys = Exclude<
  keyof LegacyTriggerProps,
  | keyof TooltipCompatTriggerProps
  | SharedExcludedKey<LegacyTriggerProps, TooltipCompatTriggerProps>
  | TamaguiTooltipPlumbingKey
  | RawPresenceStyleKey
  | ReactPlumbingKey
>
/** Fails listing the uncovered keys whenever trigger coverage regresses. */
export type TooltipTriggerPropsFullyCovered = AssertNoUncoveredKeys<UncoveredTriggerKeys>

// ── Content ─────────────────────────────────────────────────────────────

type UncoveredContentKeys = Exclude<
  keyof LegacyContentProps,
  | keyof TooltipContentCompatProps
  | SharedExcludedKey<LegacyContentProps, TooltipContentCompatProps>
  | TamaguiTooltipPlumbingKey
  | RawPresenceStyleKey
  | ReactPlumbingKey
>
/** Fails listing the uncovered keys whenever content coverage regresses. */
export type TooltipContentPropsFullyCovered = AssertNoUncoveredKeys<UncoveredContentKeys>

// ── Arrow ───────────────────────────────────────────────────────────────

type UncoveredArrowKeys = Exclude<
  keyof LegacyArrowProps,
  | keyof TooltipArrowCompatProps
  | SharedExcludedKey<LegacyArrowProps, TooltipArrowCompatProps>
  | TamaguiTooltipPlumbingKey
  | RawPresenceStyleKey
  | TamaguiArrowPlumbingKey
  | ReactPlumbingKey
>
/** Fails listing the uncovered keys whenever arrow coverage regresses. */
export type TooltipArrowPropsFullyCovered = AssertNoUncoveredKeys<UncoveredArrowKeys>

// Sanity tripwires: if module resolution degrades, the legacy prop types
// collapse and these fail before the coverage checks can lie.
type RequiredRootKey = 'open' | 'onOpenChange' | 'delay' | 'restMs' | 'placement' | 'offset' | 'allowFlip'
declare const requiredRootKeysPresent: RequiredRootKey extends keyof LegacyRootProps
  ? true
  : { missingFromLegacyRootProps: Exclude<RequiredRootKey, keyof LegacyRootProps> }
export const tooltipLegacyRootSanity: true = requiredRootKeysPresent

type RequiredContentKey =
  | 'animationDirection'
  | 'zIndex'
  | 'maxWidth'
  | 'pointerEvents'
  | 'backgroundColor'
  | 'animation'
  | 'trapFocus'
declare const requiredContentKeysPresent: RequiredContentKey extends keyof LegacyContentProps
  ? true
  : { missingFromLegacyContentProps: Exclude<RequiredContentKey, keyof LegacyContentProps> }
export const tooltipLegacyContentSanity: true = requiredContentKeysPresent

// Value-level spot checks: representative call-site prop fragments typed from
// the legacy surface must remain assignable to the compat contracts.
type AcceptsRootFragment<T extends Partial<TooltipCompatProps>> = T
export type TooltipRootValueLevelChecks = [
  // The InfoTooltip.web.tsx call-site fragment.
  AcceptsRootFragment<Pick<LegacyRootProps, 'open' | 'delay' | 'restMs' | 'placement' | 'onOpenChange'>>,
  AcceptsRootFragment<Pick<LegacyRootProps, 'children'>>,
]

type AcceptsTriggerFragment<T extends Partial<TooltipCompatTriggerProps>> = T
export type TooltipTriggerValueLevelChecks = [
  // FeeTierSelector.tsx / Swap index.tsx call-site fragments.
  AcceptsTriggerFragment<{ flex: 1; width: '100%'; alignSelf: 'stretch' }>,
  AcceptsTriggerFragment<{ position: 'relative'; width: '100%'; height: '100%' }>,
  // asChild is deliberately NARROWED (not the full legacy union): the compat
  // rejects 'except-style'/'except-style-web' at compile time because its
  // asChild always style-merges — the opposite of Tamagui's except-style
  // semantics — and no repo tooltip trigger passes them. Documented on
  // TooltipCompatTriggerProps.
  AcceptsTriggerFragment<{ asChild?: Exclude<LegacyTriggerProps['asChild'], 'except-style' | 'except-style-web'> }>,
]

type AcceptsContentFragment<T extends Partial<TooltipContentCompatProps>> = T
export type TooltipContentValueLevelChecks = [
  AcceptsContentFragment<Pick<LegacyContentProps, 'animationDirection' | 'zIndex'>>,
  // FeeTierSelector / DisconnectButton / BidMarker call-site fragments.
  AcceptsContentFragment<{ maxWidth: 280; pointerEvents: 'auto' }>,
  AcceptsContentFragment<{ pointerEvents: 'auto'; paddingVertical: 8; paddingHorizontal: 8 }>,
  AcceptsContentFragment<{ backgroundColor: 'transparent'; borderWidth: 0; p: 0; pointerEvents: 'none' }>,
  AcceptsContentFragment<{ maxWidth: 'fit-content' }>,
]
