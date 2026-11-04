import { UniverseChainId } from '@universe/chains'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { getWebSearchTabs } from 'uniswap/src/features/search/SearchModal/utils/getWebSearchTabs'
import { describe, expect, it } from 'vitest'

// Expected tab lists are literals on purpose, not derived from WEB_SEARCH_TABS.
describe('getWebSearchTabs', () => {
  it('returns every tab in order when no chain filter is set and auctions are enabled', () => {
    expect(getWebSearchTabs({ isAuctionSearchEnabled: true, chainFilter: null })).toEqual([
      SearchTab.All,
      SearchTab.Tokens,
      SearchTab.Pools,
      SearchTab.Auctions,
      SearchTab.Wallets,
    ])
  })

  it('omits Auctions when auction search is disabled', () => {
    expect(getWebSearchTabs({ isAuctionSearchEnabled: false, chainFilter: null })).toEqual([
      SearchTab.All,
      SearchTab.Tokens,
      SearchTab.Pools,
      SearchTab.Wallets,
    ])
  })

  it('keeps Pools and Auctions for an EVM chain filter', () => {
    expect(getWebSearchTabs({ isAuctionSearchEnabled: true, chainFilter: UniverseChainId.Base })).toEqual([
      SearchTab.All,
      SearchTab.Tokens,
      SearchTab.Pools,
      SearchTab.Auctions,
      SearchTab.Wallets,
    ])
  })

  it('hides Pools and Auctions when Solana is the chain filter', () => {
    expect(getWebSearchTabs({ isAuctionSearchEnabled: true, chainFilter: UniverseChainId.Solana })).toEqual([
      SearchTab.All,
      SearchTab.Tokens,
      SearchTab.Wallets,
    ])
  })

  it('hides Pools for Solana even when auction search is already disabled', () => {
    expect(getWebSearchTabs({ isAuctionSearchEnabled: false, chainFilter: UniverseChainId.Solana })).toEqual([
      SearchTab.All,
      SearchTab.Tokens,
      SearchTab.Wallets,
    ])
  })
})
