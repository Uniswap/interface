import {
  SearchResultOrHeader,
  SEARCH_RESULT_HEADER_KEY,
} from 'src/components/explore/search/SearchResultsSection'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { Chain, ExploreSearchQuery } from 'src/data/__generated__/types-and-hooks'
import {
  NFTCollectionSearchResult,
  searchResultId,
  SearchResultType,
  TokenSearchResult,
} from 'src/features/explore/searchHistorySlice'
import { fromGraphQLChain } from 'src/utils/chainId'

const MAX_TOKEN_RESULTS_COUNT = 4

type ExploreSearchResult = NonNullable<ExploreSearchQuery>

// Formats the tokens portion of explore search results into sorted array of TokenSearchResult
export function formatTokenSearchResults(
  data: ExploreSearchResult['searchTokens'],
  searchQuery: string
): TokenSearchResult[] {
  if (!data) return EMPTY_ARRAY

  // Prevent showing "duplicate" token search results for tokens that are on multiple chains
  // and share the same TokenProject id. Only show the token that has the highest 1Y Uniswap trading volume
  // ex. UNI on Mainnet, Arbitrum, Optimism -> only show UNI on Mainnet b/c it has highest 1Y volume
  const tokenResultsMap = data.reduce<Record<string, TokenSearchResult & { volume1Y: number }>>(
    (tokensMap, token) => {
      if (!token) return tokensMap

      const { chain, address, symbol, name, project, market } = token
      const chainId = fromGraphQLChain(chain)

      if (!chainId || !project) return tokensMap

      const tokenResult = {
        type: SearchResultType.Token,
        chainId,
        address,
        name,
        symbol: symbol ?? '',
        safetyLevel: project.safetyLevel,
        logoUrl: project.logoUrl,
        volume1Y: market?.volume?.value ?? 0,
      } as TokenSearchResult & { volume1Y: number }

      // For token results that share the same TokenProject id, use the token with highest volume
      const currentTokenResult = tokensMap[project.id]
      if (!currentTokenResult || tokenResult.volume1Y > currentTokenResult.volume1Y) {
        tokensMap[project.id] = tokenResult
      }
      return tokensMap
    },
    {}
  )

  return Object.values(tokenResultsMap)
    .slice(0, MAX_TOKEN_RESULTS_COUNT)
    .sort((res1: TokenSearchResult, res2: TokenSearchResult) => {
      const res1Match = isExactTokenMatch(res1, searchQuery)
      const res2Match = isExactTokenMatch(res2, searchQuery)

      if (res1Match && !res2Match) {
        return -1
      } else if (!res1Match && res2Match) {
        return 1
      } else {
        return 0
      }
    })
}

function isExactTokenMatch(searchResult: TokenSearchResult, query: string): boolean {
  return (
    searchResult.name.toLowerCase() === query.toLowerCase() ||
    searchResult.symbol.toLowerCase() === query.toLowerCase()
  )
}

export function formatNFTCollectionSearchResults(
  data: ExploreSearchResult['nftCollections']
): NFTCollectionSearchResult[] {
  if (!data) return EMPTY_ARRAY
  return data.edges.reduce<NFTCollectionSearchResult[]>((accum, { node }) => {
    const formatted = gqlNFTToNFTCollectionSearchResult(node)
    if (formatted) {
      accum.push(formatted)
    }
    return accum
  }, [])
}

type NFTCollectionItemResult = NonNullable<
  NonNullable<NonNullable<NonNullable<ExploreSearchResult['nftCollections']>>['edges']>[0]
>['node']

export const gqlNFTToNFTCollectionSearchResult = (
  node: NFTCollectionItemResult
): NFTCollectionSearchResult | null => {
  const contract = node?.nftContracts?.[0]
  // Only show NFT results that have fully populated results
  const chainId = fromGraphQLChain(node?.nftContracts?.[0]?.chain ?? Chain.Ethereum)
  if (node.name && contract?.address && chainId) {
    return {
      type: SearchResultType.NFTCollection,
      chainId,
      address: contract.address,
      name: node.name,
      imageUrl: node?.image?.url ?? null,
      isVerified: Boolean(node.isVerified),
    }
  }
  return null
}

export const getSearchResultId = (searchResult: SearchResultOrHeader): string => {
  if (searchResult.type === SEARCH_RESULT_HEADER_KEY) {
    return searchResult.title
  }
  // Unique ID for each search result
  return searchResultId(searchResult)
}
