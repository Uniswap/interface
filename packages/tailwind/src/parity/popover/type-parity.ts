/**
 * Type-level drop-in contract for the Base-UI-backed popover compat
 * (INFRA-3021): every prop accepted by the legacy
 * `AdaptiveWebPopoverContent` (`ui/src/components/popover/
 * AdaptiveWebPopoverContent.tsx`, whose surface is
 * `Omit<ComponentProps<typeof Popover.Content>, 'children' | 'zIndex'>` plus
 * its own adaptive props) is either covered by
 * `AdaptiveWebPopoverContentCompatProps` or listed in the explicit exclusion
 * unions below.
 *
 * Compiled by `tsconfig.type-parity.json` (driven from
 * `type-parity.test.ts`). A newly uncovered key fails the build with the key
 * names in the error message.
 */
import type { ComponentProps } from 'react'
import type { AdaptiveWebPopoverContent } from 'ui/src'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import type { AdaptiveWebPopoverContentCompatProps } from '../../../../mycelium/src/popover-compat/props'
import type { SharedExcludedKey } from '../core/type-exclusions'

type LegacyProps = ComponentProps<typeof AdaptiveWebPopoverContent>
type CompatProps = AdaptiveWebPopoverContentCompatProps

/**
 * Raw enterStyle/exitStyle objects: arbitrary per-call-site enter/exit styles
 * would require runtime keyframe generation; the compat popover carries the
 * legacy component's own placement-driven fade/slide as data-open/closed
 * transitions instead. See the popover exclusions ledger.
 */
type RawPresenceStyleKey = 'enterStyle' | 'exitStyle'

/**
 * Tamagui Popover/Popper plumbing with no Base UI counterpart or with a Base
 * UI-internal equivalent the compat wires itself. Each entry is documented in
 * the popover parity exclusions ledger:
 * - composition/scoping internals (`scope`, `asChild` variants beyond the
 *   compat's accepted `asChild`, `__scopePopper`)
 * - the deprecated child-spacing trio is covered by the shared compat
 *   surface's accept-and-ignore contract.
 */
type TamaguiPopoverPlumbingKey = '__scopePopper' | 'scope'

/**
 * React-reserved plumbing: `key` never reaches the component; `ref` is
 * covered behaviorally (the compat is a forwardRef component) — it
 * materializes in `ComponentProps<typeof AdaptiveWebPopoverContent>` only
 * because the legacy component is typed through forwardRef, while the compat
 * contract is the plain props interface.
 */
type ReactPlumbingKey = 'key' | 'ref'

export type ExcludedPopoverPropKey =
  | SharedExcludedKey<LegacyProps, CompatProps>
  | RawPresenceStyleKey
  | TamaguiPopoverPlumbingKey
  | ReactPlumbingKey

/**
 * Compile-time-only assert: instantiating it with a non-never union fails
 * with the offending key names in the constraint error. Replaces the
 * `Record<never, never>` value-assignment form, which is VACUOUS (any object
 * is assignable to `{}`) — verified by deliberate contract breaks; same fix
 * the TouchableArea compat (#36943) applies to its contract. Swapping the
 * form immediately surfaced the previously-masked FocusScope/Dismissable and
 * styled-variant key gaps now covered by the compat.
 */
type AssertNoUncoveredKeys<T extends never> = T

type UncoveredKeys = Exclude<keyof LegacyProps, keyof CompatProps | ExcludedPopoverPropKey>

/** Fails listing the uncovered keys whenever coverage regresses. */
export type PopoverContentPropsFullyCovered = AssertNoUncoveredKeys<UncoveredKeys>

// ---------------------------------------------------------------------------
// Nested contract: the `webBottomSheetProps` surface. One-way assignability
// cannot catch a compat replica that MISSES legacy keys (missing target keys
// never fail assignability; excess-property checks are literal-only), so the
// nested type gets its own key-coverage check mirroring the top-level
// UncoveredKeys pattern.
// ---------------------------------------------------------------------------

type LegacySheetProps = NonNullable<LegacyProps['webBottomSheetProps']>
type CompatSheetProps = NonNullable<CompatProps['webBottomSheetProps']>

/**
 * The legacy web `ModalProps` (AdaptiveWebModal.tsx) leaks `GetProps<typeof
 * View>`, which carries raw enterStyle/exitStyle — excluded for the same
 * reason as the top-level surface (see `RawPresenceStyleKey`).
 */
type ExcludedSheetPropKey = SharedExcludedKey<LegacySheetProps, CompatSheetProps> | RawPresenceStyleKey

type UncoveredSheetKeys = Exclude<keyof LegacySheetProps, keyof CompatSheetProps | ExcludedSheetPropKey>

/** Fails listing the uncovered keys whenever webBottomSheetProps coverage regresses. */
export type WebBottomSheetPropsFullyCovered = AssertNoUncoveredKeys<UncoveredSheetKeys>

// Sanity tripwires for the nested surface: the explicit web-sheet knobs plus
// a leaked View style prop must exist on the legacy type, or the coverage
// check above is checking a collapsed type.
type RequiredLegacySheetKey =
  | 'onClose'
  | 'adaptToSheet'
  | 'alignment'
  | 'hideHandlebar'
  | 'snapPointsMode'
  | 'snapPoints'
  | 'overlayOpacity'
  | 'disableRemoveScroll'
  | 'px'
  | 'testID'
declare const requiredSheetKeysPresent: RequiredLegacySheetKey extends keyof LegacySheetProps
  ? true
  : { missingFromLegacySheetProps: Exclude<RequiredLegacySheetKey, keyof LegacySheetProps> }
export const popoverLegacySheetPropsSanity: true = requiredSheetKeysPresent

// Sanity tripwires: if module resolution degrades, LegacyProps collapses and
// these fail before the coverage check can lie.
type RequiredLegacyKey =
  | 'isOpen'
  | 'isSheet'
  | 'adaptWhen'
  | 'placement'
  | 'webBottomSheetProps'
  | 'backgroundColor'
  | 'p'
  | 'py'
  | 'animation'
  | 'trapFocus'
declare const requiredKeysPresent: RequiredLegacyKey extends keyof LegacyProps
  ? true
  : { missingFromLegacyProps: Exclude<RequiredLegacyKey, keyof LegacyProps> }
export const popoverLegacyPropsSanity: true = requiredKeysPresent

// Value-level spot checks: representative call-site prop fragments typed from
// the legacy surface must remain assignable to the compat contract.
type AcceptsFragment<T extends Partial<CompatProps>> = T
// NOTE: whole-type `Pick<LegacyProps, 'webBottomSheetProps'>` assignability is
// deliberately NOT asserted: the leaked `GetProps<typeof View>` value types
// carry Tamagui-branded members (AnimatedNode, GetThemeValueForKey, null)
// that the curated compat value types reject by design — same trade-off as
// the flex contract. Coverage is pinned by UncoveredSheetKeys above; values
// by the live call-site fragments below.
export type PopoverValueLevelChecks = [
  AcceptsFragment<Pick<LegacyProps, 'isOpen' | 'isSheet' | 'adaptWhen' | 'placement'>>,
  // The exact ContextMenu.web.tsx call-site styling fragment.
  AcceptsFragment<{ backgroundColor: 'transparent'; p: '$none'; py: '$spacing8' }>,
  AcceptsFragment<Pick<LegacyProps, 'children'>>,
  // The wired FocusScope surface, with the exact legacy types (production
  // call sites: RecentlyConnectedModal, SendRecipientForm,
  // BalanceBreakdownPopover).
  AcceptsFragment<Pick<LegacyProps, 'onOpenAutoFocus' | 'onCloseAutoFocus' | 'disableFocusScope'>>,
  // The Dismissable interceptors, exact legacy event shapes.
  AcceptsFragment<
    Pick<LegacyProps, 'onEscapeKeyDown' | 'onPointerDownOutside' | 'onFocusOutside' | 'onInteractOutside'>
  >,
  // The one styled-variant call site (CreateNewTokenForm) — accepted-inert.
  AcceptsFragment<{ elevate: true }>,
]

// Every live webBottomSheetProps call-site shape in the repo must stay
// assignable to the nested compat contract (the shapes below are verbatim
// from the named consumers).
type AcceptsSheetFragment<T extends CompatSheetProps> = T
export type WebBottomSheetValueLevelChecks = [
  // TransactionSettingsModalInterface.tsx
  AcceptsSheetFragment<{ px: '$padding16'; testID: string }>,
  // MultichainPillDropdown.tsx
  AcceptsSheetFragment<{ maxHeight: string; px: '$spacing24'; onClose: () => void }>,
  // ContextMenu.web.tsx
  AcceptsSheetFragment<{ onClose: () => void }>,
  // NetworkFilterV2.web.tsx
  AcceptsSheetFragment<{ onClose: () => void; snapPoints: number[]; snapPointsMode: 'percent' }>,
]
