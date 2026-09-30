import type { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import type { Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { CurrencyInfo, MultichainSearchResult, SearchTokenStats } from 'uniswap/src/features/dataApi/types'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'

/* Types of list item options */
export enum OnchainItemListOptionType {
  Token = 'Token',
  MultichainToken = 'MultichainToken',
  Pool = 'Pool',
  WalletByAddress = 'WalletByAddress',
  ENSAddress = 'ENSAddress',
  Unitag = 'Unitag',
  Rwa = 'Rwa',
  RwaCollection = 'RwaCollection',
  EarnVault = 'EarnVault',
  Auction = 'Auction',
  Category = 'Category',
}

/** Variable-height row descriptor read by the list primitives. Absent → fixed-height row.
 *  Web measures dynamic rows at runtime (ResizeObserver); native uses the px estimates for overrideItemLayout. */
export interface DynamicRowLayout {
  /** Web: measure height at runtime instead of using the fixed row height. */
  dynamicHeight: boolean
  /** Native Legend List cell-size estimates. */
  collapsedHeightPx: number
  expandedHeightPx: number
}

export interface BaseOption {
  type: OnchainItemListOptionType
  /** Optional variable-height row layout, read by the list primitives without a domain type-narrow. */
  rowLayout?: DynamicRowLayout
}

export interface TokenOption extends BaseOption {
  type: OnchainItemListOptionType.Token
  currencyInfo: CurrencyInfo
  quantity: number | null // float representation of balance, returned by data-api
  balanceUSD: Maybe<number>
  isUnsupported?: boolean
  /** Spot price in USD; set by trending token options (rendered by TokenSelectorV2 rows), absent elsewhere. */
  priceUsd?: Maybe<number>
  /** 24h price change in percent (e.g. -1.23); set alongside `priceUsd`. */
  pricePercentChange24h?: Maybe<number>
  /** Number of chains a multichain token spans (>1 renders "N networks" in TokenSelectorV2 rows). */
  networkCount?: number
  /** Displayed category of a tokenized RWA (via `getRwaTagCategory`), set by RWA grouping; absent on non-RWA tokens. */
  rwaCategory?: RwaCategory
  /** Clean RWA asset name (e.g. "Tesla"), set by RWA grouping so the row matches the TDP; absent on non-RWA tokens. */
  rwaName?: string
  /** Raw issuer slug (e.g. "ondo"), set by RWA grouping; formatted with formatIssuerLabel at render. Absent on non-RWA. */
  rwaIssuerSlug?: string
}

export interface RwaTokenOption extends BaseOption {
  type: OnchainItemListOptionType.Rwa
  chainId: UniverseChainId
  address: string
  symbol: string
  name: string
  logoUrl?: string
}

/** A tokenized stock rendered as an expandable collection (multi-issuer) via ExpandableAssetGroup. */
export interface RwaCollectionOption extends BaseOption {
  type: OnchainItemListOptionType.RwaCollection
  rwa: Rwa
  showCategoryTag?: boolean
  searchStats?: SearchTokenStats
}

export interface MultichainTokenOption extends BaseOption {
  type: OnchainItemListOptionType.MultichainToken
  multichainResult: MultichainSearchResult
  primaryCurrencyInfo: CurrencyInfo
  /** From recent search history: open TDP with this `?chain=` when present. */
  tdpChainFilter?: UniverseChainId
  /** Displayed category of a tokenized RWA (via `getRwaTagCategory`), set by RWA grouping; absent on non-RWA tokens. */
  rwaCategory?: RwaCategory
  /** Clean RWA asset name (e.g. "Tesla"), set by RWA grouping so the row matches the TDP; absent on non-RWA tokens. */
  rwaName?: string
  /** Raw issuer slug (e.g. "ondo"), set by RWA grouping; formatted with formatIssuerLabel at render. Absent on non-RWA. */
  rwaIssuerSlug?: string
}

/** A vault share token surfaced as an Earn opportunity. Renders the vault's underlying asset (e.g. USDC) +
 *  APY; pressing it opens the underlying token's earn destination. */
export interface EarnVaultOption extends BaseOption {
  type: OnchainItemListOptionType.EarnVault
  vault: EarnVaultInfo
  /** Underlying (deposit) token of the vault, used for the row logo + symbol. */
  underlyingCurrencyInfo: Maybe<CurrencyInfo>
  apyPercent: number
  /** USD value of the user's position in this vault, shown on the right when they hold shares. */
  positionValueUsd?: number
  /** The user's position in this vault, passed to navigation when they hold shares. */
  position?: EarnPositionInfo
}

export interface PoolOption extends BaseOption {
  type: OnchainItemListOptionType.Pool
  poolId: string
  chainId: UniverseChainId
  token0CurrencyInfo: CurrencyInfo
  token1CurrencyInfo: CurrencyInfo
  protocolVersion: ProtocolVersion
  hookAddress?: string
  feeTier: number
  /** 1d volume in USD from the v2 search stats; absent on v1 results and recent-search rows. */
  volume1dUsd?: number
  /**
   * Pool fee APR from the v2 search stats, in percent units (`4.99` = 4.99%) like other backend
   * APRs (see `backendAprToPercent`). Absent on v1 results and recent-search rows.
   */
  apr?: number
}

/** A token category matched by search (All tab only); pressing it opens the Category Details page/screen. */
export interface CategoryOption extends BaseOption {
  type: OnchainItemListOptionType.Category
  category: TokenCategory
}

export type WalletOption = WalletByAddressOption | ENSAddressOption | UnitagOption

export interface WalletByAddressOption extends BaseOption {
  type: OnchainItemListOptionType.WalletByAddress
  address: Address
}
export interface ENSAddressOption extends BaseOption {
  type: OnchainItemListOptionType.ENSAddress
  address: Address
  isRawName?: boolean
  ensName: string
  primaryENSName?: string
}

export interface UnitagOption extends BaseOption {
  type: OnchainItemListOptionType.Unitag
  address: Address
  unitag: string
}

export interface AuctionOption extends BaseOption {
  type: OnchainItemListOptionType.Auction
  auctionId: string
  auctionAddress: string
  chainId: UniverseChainId
  tokenAddress: string
  tokenSymbol: string
  tokenName: string | undefined
  tokenLogoUrl: string | undefined
  currencyInfo: Maybe<CurrencyInfo>
  committedVolumeUsd: number | undefined
  /** Distinct all-time bidders. Only the top-auctions listing serves it; text-search results leave it unset. */
  uniqueBidderCount?: number
  isVerified: boolean
}

// Union of item types for different list use cases
export type MobileExploreSearchModalOption =
  | TokenOption
  | MultichainTokenOption
  | WalletOption
  | RwaCollectionOption
  | EarnVaultOption
  | CategoryOption
export type WebSearchModalOption =
  | TokenOption
  | MultichainTokenOption
  | PoolOption
  | WalletOption
  | RwaCollectionOption
  | EarnVaultOption
  | AuctionOption
  | CategoryOption
export type SearchModalOption = MobileExploreSearchModalOption | WebSearchModalOption

/** Search modal rows: single options, or one array rendered as a horizontal row (Search V2 recents pills). */
export type SearchModalListOption = SearchModalOption | SearchModalOption[]

export type TokenSelectorOption = TokenOption | TokenOption[]

// All item types combined
export type OnchainItemListOption = TokenSelectorOption | SearchModalListOption | RwaTokenOption[]

// Options renderable by the swap token-selector list (token rows/pills + the stocks row)
export type TokenSelectorListOption = TokenSelectorOption | RwaTokenOption[]
