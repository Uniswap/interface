import { Token } from '@pollum-io/sdk-core'
import { ParsedQs } from 'qs'

import { GammaPair, GlobalConst } from './constants'

const { v3FarmSortBy } = GlobalConst.utils

export const farmFilters = [
  {
    text: 'All Farms',
    id: GlobalConst.utils.v3FarmFilter.allFarms,
  },
  {
    text: 'Stablecoins',
    id: GlobalConst.utils.v3FarmFilter.stableCoin,
  },
  {
    text: 'Blue Chips',
    id: GlobalConst.utils.v3FarmFilter.blueChip,
  },
  {
    text: 'Stable LPs',
    id: GlobalConst.utils.v3FarmFilter.stableLP,
  },
  {
    text: 'Other LPs',
    id: GlobalConst.utils.v3FarmFilter.otherLP,
  },
]

export const sortColumns = [
  {
    text: 'pool',
    index: GlobalConst.utils.v3FarmSortBy.pool,
    width: 0.3,
    justify: 'flex-start',
  },
  {
    text: 'tvl',
    index: GlobalConst.utils.v3FarmSortBy.tvl,
    width: 0.2,
    justify: 'flex-start',
  },
  {
    text: 'rewards',
    index: GlobalConst.utils.v3FarmSortBy.rewards,
    width: 0.3,
    justify: 'flex-start',
  },
  {
    text: 'apr',
    index: GlobalConst.utils.v3FarmSortBy.apr,
    width: 0.2,
    justify: 'flex-start',
  },
]

export const tabsFarm = [
  {
    text: 'My Farms',
    id: 0,
    link: 'my-farms',
  },
  {
    text: 'Gamma Farms',
    id: 1,
    link: 'gamma-farms',
    hasSeparator: true,
  },
]

export const tabsFarmDefault = [
  {
    text: 'My Farms',
    id: 0,
    link: 'my-farms',
  },
]

export const sortColumnsGamma = [
  {
    text: 'pool',
    index: v3FarmSortBy.pool,
    width: 0.3,
    justify: 'flex-start',
  },
  {
    text: 'tvl',
    index: v3FarmSortBy.tvl,
    width: 0.2,
    justify: 'flex-start',
  },
  {
    text: 'rewards',
    index: v3FarmSortBy.rewards,
    width: 0.3,
    justify: 'flex-start',
  },
  {
    text: 'apr',
    index: v3FarmSortBy.apr,
    width: 0.2,
    justify: 'flex-start',
  },
]

export const buildRedirectPath = (currentPath: string, parsedQuery: ParsedQs, status: string) => {
  if (parsedQuery && parsedQuery.farmStatus) {
    return currentPath.replace(`farmStatus=${parsedQuery.farmStatus}`, `farmStatus=${status}`)
  }
  const queryDelimiter = currentPath.includes('?') ? '&' : '?'
  return `${currentPath}${queryDelimiter}farmStatus=${status}`
}

export interface itemGammaToken extends GammaPair {
  token0: Token
  token1: Token
}

interface Global {
  stableCoins: {
    570: Token[]
  }
  blueChips: {
    570: (Token | undefined)[]
  }
  stablePairs: {
    570: Token[][]
  }
}

export const doesItemMatchSearch = (item: itemGammaToken, search: string) => {
  return (
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    (item.token0?.symbol?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (item.token0?.address.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (item.token1?.symbol?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (item.token1?.address.toLowerCase().includes(search.toLowerCase()) ?? false)
  )
}

export const doesItemMatchFilter = (item: itemGammaToken, farmFilter: string, GlobalData: Global) => {
  const blueChipCondition =
    GlobalData.blueChips[570].some((token) => item.token0?.address.toLowerCase() === token?.address.toLowerCase()) &&
    GlobalData.blueChips[570].some((token) => item.token1?.address.toLowerCase() === token?.address.toLowerCase())

  const stableCoinCondition =
    GlobalData.stableCoins[570].some((token) => item.token0?.address.toLowerCase() === token.address.toLowerCase()) &&
    GlobalData.stableCoins[570].some((token) => item.token1?.address.toLowerCase() === token.address.toLowerCase())

  const stableLPCondition = GlobalData.stablePairs[570].some(
    (tokens) =>
      tokens.some((token) => item.token0?.address.toLowerCase() === token.address.toLowerCase()) &&
      tokens.some((token) => item.token1?.address.toLowerCase() === token.address.toLowerCase())
  )
  const { v3FarmFilter } = GlobalConst.utils

  return farmFilter === v3FarmFilter.blueChip
    ? blueChipCondition
    : farmFilter === v3FarmFilter.stableCoin
    ? stableCoinCondition
    : farmFilter === v3FarmFilter.stableLP
    ? stableLPCondition
    : farmFilter === v3FarmFilter.otherLP
    ? !blueChipCondition && !stableCoinCondition && !stableLPCondition
    : true
}
