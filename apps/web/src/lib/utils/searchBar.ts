import { GqlSearchToken } from 'graphql/data/SearchTokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils'
import { SearchResultType, TokenSearchResult } from 'uniswap/src/features/search/SearchResult'
import { tokenAddressOrNativeAddress } from 'uniswap/src/features/search/utils'

export const searchTokenToTokenSearchResult = (
  searchToken: GqlSearchToken & { chainId: UniverseChainId; address: string },
): TokenSearchResult => {
  return {
    type: SearchResultType.Token,
    chainId: searchToken.chainId,
    symbol: searchToken.symbol ?? '',
    address: tokenAddressOrNativeAddress(searchToken.address, searchToken.chainId),
    name: searchToken.name ?? null,
    logoUrl: searchToken.project?.logoUrl ?? null,
    safetyInfo: getCurrencySafetyInfo(searchToken.project?.safetyLevel, searchToken.protectionInfo),
    feeData: searchToken.feeData ?? null,
  }
}
