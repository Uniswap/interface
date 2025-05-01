import { UniverseChainId } from 'uniswap/src/features/chains/types'

import { ProtocolVersion } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

import { OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/TokenSelector/types'
import { PoolOption } from 'uniswap/src/components/lists/items/types'

export const MOCK_POOL_OPTION_ITEM: PoolOption = {
  poolId: '0x1234567890123456789012345678901234567890',
  chainId: UniverseChainId.Unichain,
  token0CurrencyInfo: {
    currency: {
      chainId: UniverseChainId.Unichain,
      address: '0x1234567890123456789012345678901234567890',
      decimals: 18,
      name: 'Unichain',
      symbol: 'UNI',
    },
  },
  token1CurrencyInfo: {
    currency: {
      chainId: UniverseChainId.Unichain,
      address: '0x1234567890123456789012345678901234567890',
      decimals: 18,
      name: 'Unichain',
      symbol: 'UNI',
    },
  },
  hookAddress: '0x1234567890123456789012345678901234567890',
  protocolVersion: ProtocolVersion.V3,
  feeTier: 3000,
} as PoolOption

export const MOCK_RECENT_POOLS_SECTION: OnchainItemSection<PoolOption>[] = [
  {
    sectionKey: OnchainItemSectionName.RecentSearches,
    data: [MOCK_POOL_OPTION_ITEM, MOCK_POOL_OPTION_ITEM], // 2
  },
]

export const getMockTrendingPoolsSection = (numberOfResults = 15): OnchainItemSection<PoolOption>[] => [
  {
    sectionKey: OnchainItemSectionName.TrendingPools,
    data: Array(numberOfResults).fill(MOCK_POOL_OPTION_ITEM),
  },
]
