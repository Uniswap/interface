/**
 * Type-level drop-in contract for the Base-UI-backed network selector compat
 * (INFRA-3021 dropdown set): the exact `NetworkFilterV2Props` surface
 * (`uniswap/src/components/network/NetworkFilterV2/NetworkFilterV2.tsx`) must
 * be covered by — and whole-type assignable to — the compat contract,
 * instantiated with the real `UniverseChainId` enum (the compat is generic
 * over the chain-id type because a bare `number` is not assignable to a
 * numeric enum under strictFunctionTypes).
 *
 * Compiled by `tsconfig.type-parity.json` (driven from
 * `type-parity.test.ts`). A newly uncovered key fails the build with the key
 * names in the error message.
 */
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import type {
  NetworkSelectorCompatProps,
  TieredNetworkOptionsCompat,
} from '../../../../mycelium/src/network-selector-compat/types'
// Relative cross-package imports on purpose: type-only legacy references
// compiled by the dedicated tsconfig.type-parity.json program (see the menu
// type-parity file for the package-boundary rationale).
// nx-ignore-next-line
import type { NetworkFilterV2Props } from '../../../../uniswap/src/components/network/NetworkFilterV2/NetworkFilterV2'
// nx-ignore-next-line
import type { TieredNetworkOptions } from '../../../../uniswap/src/components/network/NetworkFilterV2/types'
// nx-ignore-next-line
import type { UniverseChainId } from '../../../../uniswap/src/features/chains/types'

type CompatProps = NetworkSelectorCompatProps<UniverseChainId>

// ── Key coverage ─────────────────────────────────────────────────────────

/**
 * Compile-time-only assert: instantiating it with a non-never union fails
 * with the offending key names in the constraint error. (The
 * `Record<never, never>` value-assignment pattern the older contracts use is
 * vacuous — any object is assignable to `{}` — verified by deliberately
 * breaking a prop; flagged as a follow-up for the flex/popover/menu
 * contracts.)
 */
type AssertNoUncoveredKeys<T extends never> = T

type UncoveredNetworkFilterV2Keys = Exclude<keyof NetworkFilterV2Props, keyof CompatProps>
export type NetworkFilterV2PropsFullyCovered = AssertNoUncoveredKeys<UncoveredNetworkFilterV2Keys>

// ── Whole-type assignability ─────────────────────────────────────────────

// The full legacy props object must be assignable — every call site of
// NetworkFilterV2 can pass its exact props to the compat unchanged.
declare const legacyNetworkFilterV2Props: NetworkFilterV2Props
export const networkFilterV2PropsAssignable: CompatProps = legacyNetworkFilterV2Props

// The tiered-options payload (built by useNetworkSelectorOptions) fits the
// compat's structural twin in both directions of use.
declare const legacyTieredOptions: TieredNetworkOptions
export const tieredOptionsAssignable: TieredNetworkOptionsCompat<UniverseChainId> = legacyTieredOptions

// ── Sanity tripwires ─────────────────────────────────────────────────────

type RequiredNetworkFilterV2Key = 'chainIds' | 'selectedChain' | 'onPressChain' | 'includeAllNetworks' | 'tieredOptions'
declare const requiredKeysPresent: RequiredNetworkFilterV2Key extends keyof NetworkFilterV2Props
  ? true
  : { missingFromNetworkFilterV2Props: Exclude<RequiredNetworkFilterV2Key, keyof NetworkFilterV2Props> }
export const networkFilterV2LegacySanity: true = requiredKeysPresent

// The selection callback keeps the legacy null leg ("All networks").
declare const compatProps: CompatProps
export const onPressChainAcceptsNull: (chainId: UniverseChainId | null) => void = compatProps.onPressChain
