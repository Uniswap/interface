import { OnchainItemSectionName, type OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { OnchainItemListOptionType, PoolOption } from 'uniswap/src/components/lists/items/types'
import { ProtocolVersion } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export const MOCK_POOL_OPTION_ITEM: PoolOption = {
  type: OnchainItemListOptionType.Pool,
  poolId: '0x1234567890123456789012345678901234567890',
  chainId: UniverseChainId.Unichain,
  token0CurrencyInfo: {
    currencyId: '130-0x078d782b760474a361dda0af3839290b0ef57ad6',
    currency: {
      chainId: UniverseChainId.Unichain,
      address: '0x078d782b760474a361dda0af3839290b0ef57ad6',
      decimals: 18,
      name: 'USD Coin',
      symbol: 'USDC',
    },
  },
  token1CurrencyInfo: {
    currencyId: '130-0x9151434b16b9763660705744891fA906F660EcC5',
    currency: {
      chainId: UniverseChainId.Unichain,
      address: '0x9151434b16b9763660705744891fA906F660EcC5',
      decimals: 18,
      name: 'USD₮0',
      symbol: 'USD₮0',
    },
  },
  hookAddress: '0x1234567890123456789012345678901234567890',
  protocolVersion: ProtocolVersion.V3,
  feeTier: 3000,
} as PoolOption

export const getMockTrendingPoolsSection = (numberOfResults = 15): OnchainItemSection<PoolOption>[] => [
  {
    sectionKey: OnchainItemSectionName.TrendingPools,
    data: Array(numberOfResults).fill(MOCK_POOL_OPTION_ITEM),
  },
]
