import type { AuctionOption } from 'uniswap/src/components/lists/items/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

/** `rwaIssuerChild` is the RwaCollection's expanded issuer sub-rows (the collection's child rows) — distinguished
 *  from `token` because those rows sit deeper in the expandable shell's nesting and need a different offset. */
export type SearchModalRowVariant = 'token' | 'rwaIssuerChild'

/** Web: wraps a row with its hover card — the token price chart card for token rows, the auction card for auction rows. */
export type SearchModalRowWrapperProps = { element: JSX.Element } & (
  | { variant: SearchModalRowVariant; currencyInfo: CurrencyInfo }
  | { variant: 'auction'; auction: AuctionOption }
)

export type SearchModalRowWrapper = (props: SearchModalRowWrapperProps) => JSX.Element

export enum SearchTab {
  All = 'All',
  Tokens = 'Tokens',
  Pools = 'Pools',
  Auctions = 'Auctions',
  Wallets = 'Wallets',
}

export const WEB_SEARCH_TABS = [SearchTab.All, SearchTab.Tokens, SearchTab.Pools, SearchTab.Auctions, SearchTab.Wallets]
export const MOBILE_SEARCH_TABS = [SearchTab.All, SearchTab.Tokens, SearchTab.Wallets]
