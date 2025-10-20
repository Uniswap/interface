import { GraphQLApi } from '@universe/api'
import { PersistState } from 'redux-persist'
import { PreV55SearchResult, PreV55SearchResultType, TokenSearchResult } from 'uniswap/src/state/oldTypes'

export type PersistAppStateV15 = {
  _persist: PersistState
}

const recentSearchAtomName = 'recentlySearchedAssetsV3'

type TokenSearchResultWeb = Omit<TokenSearchResult, 'type'> & {
  type: PreV55SearchResultType.Token | PreV55SearchResultType.NFTCollection
  address: string
  chain: GraphQLApi.Chain
  isNft?: boolean
  isToken?: boolean
  isNative?: boolean
}

function webResultToUniswapResult(webItem: TokenSearchResultWeb): PreV55SearchResult | null {
  if (webItem.type === PreV55SearchResultType.Token) {
    return {
      type: PreV55SearchResultType.Token,
      chainId: webItem.chainId,
      symbol: webItem.symbol,
      address: webItem.address,
      name: webItem.name,
      logoUrl: webItem.logoUrl,
      safetyInfo: webItem.safetyInfo,
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (webItem.type === PreV55SearchResultType.NFTCollection) {
    return {
      type: PreV55SearchResultType.NFTCollection,
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
  const translatedResults: PreV55SearchResult[] = webSearchHistory
    .map(webResultToUniswapResult)
    .filter((r): r is PreV55SearchResult => r !== null)

  // set new state as this modified search history
  newState.searchHistory = { results: translatedResults }

  // Delete the atom value
  localStorage.removeItem(recentSearchAtomName)

  return { ...newState, _persist: { ...state._persist, version: 15 } }
}
