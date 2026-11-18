import { OnchainItemListOptionType, type SearchModalOption } from 'uniswap/src/components/lists/items/types'
import type { SearchTokenStats } from 'uniswap/src/features/dataApi/types'

export function optionSearchStats(option: SearchModalOption): SearchTokenStats | undefined {
  switch (option.type) {
    case OnchainItemListOptionType.Token:
      return option.currencyInfo.searchStats
    case OnchainItemListOptionType.MultichainToken:
      return option.multichainResult.stats
    case OnchainItemListOptionType.RwaCollection:
      return option.searchStats
    default:
      return undefined
  }
}
