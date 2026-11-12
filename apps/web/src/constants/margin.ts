import { UniverseChainId } from '@universe/chains'
import { marginPairKey } from 'uniswap/src/features/transactions/margin/marginPairKey'
import type {
  MarginDirection,
  MarginMarketKey,
  MarginPairKey,
  MarginVenue,
} from 'uniswap/src/features/transactions/margin/types'
import type { Address } from '~/chains'

// Canonical margin contracts on Ethereum mainnet (chainId 1).
export const MARGIN_CHAIN_ID = UniverseChainId.Mainnet

// Shared quote tuning: poll interval and input debounce. Slippage is not here — the form store owns
// the only default, so a quote can never be bounded by a constant the settings row can't move.
export const MARGIN_QUOTE_REFETCH_MS = 15_000
// Positions poll. Shared so the table, the chart overlays and the staleness cue agree on one cadence.
export const MARGIN_POSITIONS_REFETCH_MS = 20_000
// The markets registry: slower than quotes/positions because the venue list and its caps move rarely.
// Beside its siblings rather than in the query hook, so the freshness rule can read it without
// importing a module that surfaces routinely mock.
export const MARGIN_MARKETS_REFETCH_MS = 60_000
export const MARGIN_DEBOUNCE_MS = 300
// Max width of the margin picker modals.
export const MARGIN_SELECTOR_MODAL_MAX_WIDTH = 480

// Temporary non-canonical mainnet MarginRouter — this deployment is not the final one, and the
// address changes when the canonical router ships. Resolved by the client rather than read off a
// plan, and used only to tell the collateral permit apart from the payment permit by its spender.
// @uniswap/margin-sdk's MARGIN_ADDRESSES is the source of truth; inlined because the SDK publishes
// no `./addresses` subpath, so importing it would pull its generated-ABI module into the bundle.
// TODO: read from @uniswap/margin-sdk once it publishes an ./addresses subpath — that also retires
// this copy when the canonical router lands.
export const MARGIN_ROUTER_ADDRESS: Address = '0x000000000075e82F7B7DdC5DD1B4984b560eF5D4'

// Chains a cross-chain payment may originate from — which sources the pay-with list offers. The
// plan names the chain each of its steps runs on.
export const MARGIN_BRIDGE_SOURCE_CHAINS: UniverseChainId[] = [
  UniverseChainId.Base,
  UniverseChainId.ArbitrumOne,
  UniverseChainId.Unichain,
]

// Chains the wallet can pay from: the margin chain plus every bridge source.
export const MARGIN_PAYMENT_SOURCE_CHAIN_IDS: UniverseChainId[] = [MARGIN_CHAIN_ID, ...MARGIN_BRIDGE_SOURCE_CHAINS]

export interface MarginTokenInfo {
  address: Address
  symbol: string
  decimals: number
}

// A single (collateral, debt) market for an asset, backed by a Morpho market.
export interface MarginPair {
  // Composite market key = ordered collateral→debt addresses (see marginMarketKey).
  key: MarginMarketKey
  debt: MarginTokenInfo
  // Lending venue for this pair-row — the selector renders one row per venue.
  venue: MarginVenue
  // LONG for the collateral/debt pair as-is; SHORT for the reversed pair. Absent → derive from the
  // pair's token identity (marginMarketDirection).
  direction?: MarginDirection
  // Liquidation LTV as a WAD (1e18) string. '0' when the venue omits it on the wire (Aave).
  lltvWad: string
  // This venue's server-authored max leverage, decimal. The selector's headline is a max across the
  // group's pairs.
  maxLeverage?: number
  // Representative borrow APY (bps) for the selector. Placeholder — overlaid with live rates.
  borrowRateBps?: number
  // Borrowable depth at this venue, RAW debt units. Absent until the live registry overlays it.
  availableBorrowLiquidity?: string
}

// An asset the user can go long, grouping every debt market that shares its collateral token.
export interface MarginAsset {
  // Asset ticker, e.g. 'ETH', 'stETH', 'Gold'. Stable market-key component — not user-facing.
  asset: string
  // Full display name, e.g. 'Ethereum'.
  name: string
  // User-facing symbol for the deposited token, e.g. 'cbBTC'. May differ from the ticker.
  displaySymbol: string
  collateral: MarginTokenInfo
  // Only ETH/WETH-collateral markets supply equity as native ETH; others use ERC20 + Permit2.
  shouldUseNativeEquity: boolean
  // Direction shared by every pair under this collateral (LONG-collateral vs SHORT-collateral asset
  // grouping). Absent → derive from the pair's token identity (marginMarketDirection).
  direction?: MarginDirection
  pairs: MarginPair[]
}

// Flattened per-pair market, keyed by pair.key. Shape kept stable so existing consumers
// (form store, quote/open/manage hooks, positions panel) keep working.
export interface MarginMarket {
  key: MarginMarketKey
  // Asset ticker (e.g. 'ETH'); stable market-key component, not user-facing.
  asset: string
  // Full asset name (e.g. 'Ethereum').
  name: string
  // User-facing symbol for the deposited token (e.g. 'cbBTC'); used for labels + logo fallbacks.
  displaySymbol: string
  collateral: MarginTokenInfo
  debt: MarginTokenInfo
  // Lending venue backing this market (Morpho or Aave v3).
  venue: MarginVenue
  // LONG for the collateral/debt pair as-is; SHORT for the reversed pair. Absent → derive from the
  // pair's token identity (marginMarketDirection).
  direction?: MarginDirection
  lltvWad: string
  // Server-authored cap for THIS venue, decimal (venues[].maxLeverage). The slider ceiling is a
  // client max() over the allowed venues' values — deriving one from lltv is forbidden, so a market
  // built off-registry (a position whose venue the wire no longer lists) simply has none.
  maxLeverage?: number
  // What `open.marketId` names on POST /margin/quote. Absent off-registry, like maxLeverage.
  marketId?: string
  shouldUseNativeEquity: boolean
}

// One selectable market pair. Rows inside it differ only by venue.
export interface MarginPairGroup {
  key: string
  // Form identity for this group. base/quote are DISPLAY legs (the stable one is always the quote),
  // so they cannot stand in for the role-ordered collateral→debt key a short would otherwise invert.
  pairKey: MarginPairKey
  base: MarginTokenInfo
  quote: MarginTokenInfo
  direction: MarginDirection
  pairs: MarginPair[]
}

export const WETH: MarginTokenInfo = {
  address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  symbol: 'WETH',
  decimals: 18,
}
export const USDC: MarginTokenInfo = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  symbol: 'USDC',
  decimals: 6,
}
export const USDT: MarginTokenInfo = {
  address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  symbol: 'USDT',
  decimals: 6,
}

// Mirrors the backend's MARGIN_STABLE_TOKENS (marginConfig.ts). The backend admits a market only when
// exactly one leg is in this set, so the base/quote split is total.
export const MARGIN_QUOTE_TOKEN_ADDRESSES: ReadonlySet<string> = new Set(
  [USDC.address, USDT.address].map((a) => a.toLowerCase()),
)

// One venue's row under a pair. The venue is REQUIRED: this keys the per-venue registry, and a
// defaulted one would silently resolve a market the caller never named.
export function marginMarketKey({
  collateralToken,
  debtToken,
  venue,
}: {
  collateralToken: string
  debtToken: string
  venue: MarginVenue
}): MarginMarketKey {
  return `${marginPairKey({ collateralToken, debtToken })}-${venue}`
}

export const DEFAULT_MARGIN_PAIR_KEY: MarginPairKey = marginPairKey({
  collateralToken: WETH.address,
  debtToken: USDC.address,
})
