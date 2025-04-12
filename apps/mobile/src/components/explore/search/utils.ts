import { SEARCH_RESULT_HEADER_KEY } from 'src/components/explore/search/constants'
import { SearchResultOrHeader } from 'src/components/explore/search/types'
import { Chain, ExploreSearchQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { getCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils'
import {
  NFTCollectionSearchResult,
  SearchResultType,
  TokenSearchResult,
} from 'uniswap/src/features/search/SearchResult'
import { searchResultId } from 'uniswap/src/features/search/searchHistorySlice'

const MAX_TOKEN_RESULTS_COUNT = 8

type ExploreSearchResult = NonNullable<ExploreSearchQuery>

// Formats the tokens portion of explore search results into sorted array of TokenSearchResult
export function formatTokenSearchResults(
  data: ExploreSearchResult['searchTokens'],
  searchQuery: string,
  selectedChain: UniverseChainId | null,
): TokenSearchResult[] | undefined {
  if (!data) {
    return undefined
  }

  // Prevent showing "duplicate" token search results for tokens that are on multiple chains
  // and share the same TokenProject id. Only show the token that has the highest 1Y Uniswap trading volume
  // ex. UNI on Mainnet, Arbitrum, Optimism -> only show UNI on Mainnet b/c it has highest 1Y volume
  const tokenResultsMap = data.reduce<Record<string, TokenSearchResult & { volume1D: number }>>((tokensMap, token) => {
    if (!token) {
      return tokensMap
    }

    const { name, chain, address, symbol, project, market, protectionInfo, feeData } = token
    const chainId = fromGraphQLChain(chain)

    const shoulderFilterByChain = !!selectedChain
    const chainMismatch = shoulderFilterByChain && selectedChain !== chainId

    if (!chainId || !project || chainMismatch) {
      return tokensMap
    }

    const { safetyLevel, logoUrl } = project

    const tokenResult: TokenSearchResult & { volume1D: number } = {
      type: SearchResultType.Token,
      chainId,
      address: address ?? null,
      name: name ?? null,
      symbol: symbol ?? '',
      logoUrl: logoUrl ?? null,
      volume1D: market?.volume?.value ?? 0,
      safetyInfo: getCurrencySafetyInfo(safetyLevel, protectionInfo),
      feeData: feeData ?? null,
    }

    // For token results that share the same TokenProject id, use the token with highest volume
    const currentTokenResult = tokensMap[project.id]
    if (!currentTokenResult || tokenResult.volume1D > currentTokenResult.volume1D) {
      tokensMap[project.id] = tokenResult
    }
    return tokensMap
  }, {})

  return Object.values(tokenResultsMap)
    .slice(0, MAX_TOKEN_RESULTS_COUNT)
    .sort((res1: TokenSearchResult, res2: TokenSearchResult) => {
      const res1Match = isExactTokenSearchResultMatch(res1, searchQuery)
      const res2Match = isExactTokenSearchResultMatch(res2, searchQuery)

      if (res1Match && !res2Match) {
        return -1
      } else if (!res1Match && res2Match) {
        return 1
      } else {
        return 0
      }
    })
}

function isExactTokenSearchResultMatch(searchResult: TokenSearchResult, query: string): boolean {
  return (
    searchResult.name?.toLowerCase() === query.toLowerCase() ||
    searchResult.symbol.toLowerCase() === query.toLowerCase()
  )
}

export function formatNFTCollectionSearchResults(
  data: ExploreSearchResult['nftCollections'],
  selectedChain: UniverseChainId | null,
): NFTCollectionSearchResult[] | undefined {
  if (!data) {
    return undefined
  }

  return data.edges.reduce<NFTCollectionSearchResult[]>((accum, { node }) => {
    const formatted = gqlNFTToNFTCollectionSearchResult(node)

    const chainMismatch = selectedChain && formatted && formatted.chainId !== selectedChain

    if (formatted && !chainMismatch) {
      accum.push(formatted)
    }
    return accum
  }, [])
}

type NFTCollectionItemResult = NonNullable<
  NonNullable<NonNullable<NonNullable<ExploreSearchResult['nftCollections']>>['edges']>[0]
>['node']

export const gqlNFTToNFTCollectionSearchResult = (node: NFTCollectionItemResult): NFTCollectionSearchResult | null => {
  const contract = node?.nftContracts?.[0]
  // Only show NFT results that have fully populated results
  const chainId = fromGraphQLChain(contract?.chain ?? Chain.Ethereum)
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
