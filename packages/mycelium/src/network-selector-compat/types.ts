/**
 * The network-selector compat prop contracts (INFRA-3021 dropdown set): a
 * drop-in for the legacy `NetworkFilterV2`
 * (`uniswap/src/components/network/NetworkFilterV2/NetworkFilterV2.tsx`) —
 * the exact `NetworkFilterV2Props` surface plus optional host seams for
 * everything the legacy component resolves from packages/uniswap (chain
 * display metadata, defaultChainId, i18n strings, analytics). The parity
 * suite in `packages/tailwind/src/parity/network-selector` asserts key
 * coverage and whole-type assignability against the real legacy type.
 *
 * Generic over the chain-id type: `UniverseChainId` is a numeric enum, and a
 * bare `number` is not assignable to it under strictFunctionTypes — the
 * generic keeps `onPressChain` sound for legacy call sites.
 */
import type * as React from 'react'

/** Structural twin of the legacy `NetworkSelectorOption` (types.ts). */
export interface NetworkSelectorOptionCompat<TChainId extends number = number> {
  chainId: TChainId
  label: string
  balanceUSD: number
}

/** Structural twin of the legacy `TieredNetworkOptions` (types.ts). */
export interface TieredNetworkOptionsCompat<TChainId extends number = number> {
  withBalances: NetworkSelectorOptionCompat<TChainId>[]
  otherNetworks: NetworkSelectorOptionCompat<TChainId>[]
}

/** Host-provided display metadata for one chain (the getChainInfo seam, ledgered). */
export interface NetworkSelectorChainDisplayCompat {
  label: string
  /** Additional search fields (the legacy interfaceName leg). */
  keywords?: string[]
  /** Row logo slot (legacy NetworkLogo icon24). */
  logo?: React.ReactNode
  /** Trigger logo slot (legacy NetworkLogo icon20); falls back to `logo`. */
  triggerLogo?: React.ReactNode
  /** Badge slot after the label (legacy NewTag / Beta pill). */
  badge?: React.ReactNode
}

/** Host-injected i18n strings with English defaults (ledgered). */
export interface NetworkSelectorLabelsCompat {
  searchPlaceholder?: string
  allNetworks?: string
  withBalances?: string
  otherNetworks?: string
  noResults?: string
}

/** The analytics seam (legacy Trace modal=NetworkSelector + NetworkFilterSelected fields, ledgered). */
export interface NetworkSelectorTelemetryAdapterCompat<TChainId extends number = number> {
  onSelectorOpened?: () => void
  onSelectorClosed?: () => void
  onNetworkSelected?: (info: { chainId: TChainId | null; previousChainId: TChainId | null }) => void
}

export interface NetworkSelectorCompatProps<TChainId extends number = number> {
  // ── The exact NetworkFilterV2Props surface ──────────────────────────────
  chainIds: TChainId[]
  selectedChain: TChainId | null
  onPressChain: (chainId: TChainId | null) => void
  includeAllNetworks?: boolean
  tieredOptions?: TieredNetworkOptionsCompat<TChainId>

  // ── Compat seams (all optional — whole-type drop-in stays intact) ──────
  /** Chain display metadata (legacy getChainInfo — ledgered). Fallback label: `Chain {id}`. */
  getChainDisplay?: (chainId: TChainId) => NetworkSelectorChainDisplayCompat
  /** Legacy useEnabledChains().defaultChainId (ledgered): the displayed chain when nothing is selected. */
  defaultChainId?: TChainId
  /** Subset pile for the All-networks row (legacy allNetworksChainIds → NetworkPile). */
  allNetworksLogoPile?: React.ReactNode[]
  /** Logo shown on the trigger in the All-networks display state. */
  allNetworksLogo?: React.ReactNode
  labels?: NetworkSelectorLabelsCompat
  telemetryAdapter?: NetworkSelectorTelemetryAdapterCompat<TChainId>
  /** GATED sheet leg seam: suppresses autoFocus exactly like the legacy sheet branch (ledgered). */
  isSheet?: boolean
  /** Tooltip stand-in on the trigger (title + aria-label until #36951 lands, ledgered). */
  triggerTooltipLabel?: string
  testID?: string
}
