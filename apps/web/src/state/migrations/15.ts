import { PersistState } from 'redux-persist'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { SearchResult, SearchResultType, TokenSearchResult } from 'uniswap/src/features/search/SearchResult'

export type PersistAppStateV15 = {
  _persist: PersistState
}

const recentSearchAtomName = 'recentlySearchedAssetsV3'

type TokenSearchResultWeb = Omit<TokenSearchResult, 'type'> & {
  type: SearchResultType.Token | SearchResultType.NFTCollection
  address: string
  chain: Chain
  isNft?: boolean
  isToken?: boolean
  isNative?: boolean
}

function webResultToUniswapResult(webItem: TokenSearchResultWeb): SearchResult | null {
  if (webItem.type === SearchResultType.Token) {
    return {
      type: SearchResultType.Token,
      chainId: webItem.chainId,
      symbol: webItem.symbol,
      address: webItem.address,
      name: webItem.name,
      logoUrl: webItem.logoUrl,
      safetyInfo: webItem.safetyInfo,
    }
  } else if (webItem.type === SearchResultType.NFTCollection) {
    return {
      type: SearchResultType.NFTCollection,
      chainId: webItem.chainId,
      address: webItem.address,
      name: webItem.name!,
      imageUrl: webItem.logoUrl,
      isVerified: false,
    }
  } else {
    return null
  }
}

/**
 * Migrate existing search history atom to shared redux state
 */
export const migration15 = (state: PersistAppStateV15 | undefined) => {
  if (!state) {
    return undefined
  }

  const newState: any = { ...state }

  const recentlySearchedAssetsAtomValue = localStorage.getItem(recentSearchAtomName)
  const webSearchHistory = JSON.parse(recentlySearchedAssetsAtomValue ?? '[]') as TokenSearchResultWeb[]

  // map old search items to new search items
  const translatedResults: SearchResult[] = webSearchHistory
    .map(webResultToUniswapResult)
    .filter((r): r is SearchResult => r !== null)

  // set new state as this modified search history
  newState.searchHistory = { results: translatedResults }

  // Delete the atom value
  localStorage.removeItem(recentSearchAtomName)

  return { ...newState, _persist: { ...state._persist, version: 15 } }
}
