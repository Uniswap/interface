import { SearchTokensResponse, SearchType } from '@uniswap/client-search/dist/search/v1/api_pb'
import { useMemo } from 'react'
import { ProtectionResult } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { searchTokenToCurrencyInfo, useSearchTokensAndPoolsQuery } from 'uniswap/src/data/rest/searchTokensAndPools'
import { GqlResult } from 'uniswap/src/data/types'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isBackendSupportedChainId } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo, TokenList } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { NUMBER_OF_RESULTS_LONG } from 'uniswap/src/features/search/SearchModal/constants'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'

// Helper function to get fallback tokens for non-backend-supported chains
function getFallbackTokensForChain(chainId: UniverseChainId, searchQuery: string | null): CurrencyInfo[] {
  const chainInfo = getChainInfo(chainId)
  const tokens = chainInfo.tokens

  // Convert tokens to CurrencyInfo format
  const fallbackTokens: CurrencyInfo[] = []

  // Add native currency
  const nativeCurrency = chainInfo.nativeCurrency
  const nativeCurrencyObj = buildCurrency({
    chainId,
    address: nativeCurrency.address,
    decimals: nativeCurrency.decimals,
    symbol: nativeCurrency.symbol,
    name: nativeCurrency.name,
  })

  if (nativeCurrencyObj) {
    fallbackTokens.push(
      buildCurrencyInfo({
        currency: nativeCurrencyObj,
        currencyId: currencyId(nativeCurrencyObj),
        logoUrl: undefined,
        safetyInfo: {
          tokenList: TokenList.Default,
          protectionResult: ProtectionResult.Benign,
        },
      }),
    )
  }

  // Add stablecoins
  tokens.stablecoins.forEach((token) => {
    fallbackTokens.push(
      buildCurrencyInfo({
        currency: token,
        currencyId: currencyId(token),
        logoUrl: undefined,
        safetyInfo: {
          tokenList: TokenList.Default,
          protectionResult: ProtectionResult.Benign,
        },
      }),
    )
  })

  // Filter by search query if provided
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    return fallbackTokens.filter(
      (token) =>
        token.currency.symbol?.toLowerCase().includes(query) || token.currency.name?.toLowerCase().includes(query),
    )
  }

  return fallbackTokens
}

export function useSearchTokens({
  searchQuery,
  chainFilter,
  skip,
  size = NUMBER_OF_RESULTS_LONG,
}: {
  searchQuery: string | null
  chainFilter: UniverseChainId | null
  skip: boolean
  size?: number
}): GqlResult<CurrencyInfo[]> {
  const { chains: enabledChainIds } = useEnabledChains()

  const variables = useMemo(
    () => ({
      searchQuery: searchQuery ?? undefined,
      chainIds: chainFilter ? [chainFilter] : enabledChainIds,
      searchType: SearchType.TOKEN,
      page: 1,
      size,
    }),
    [searchQuery, chainFilter, size, enabledChainIds],
  )

  const tokenSelect = useEvent((data: SearchTokensResponse): CurrencyInfo[] => {
    return data.tokens.map((token) => searchTokenToCurrencyInfo(token)).filter((c): c is CurrencyInfo => Boolean(c))
  })

  const {
    data: tokens,
    error,
    isPending,
    refetch,
  } = useSearchTokensAndPoolsQuery<CurrencyInfo[]>({
    input: variables,
    enabled: !skip,
    select: tokenSelect,
  })

  // Check if we're searching on a specific non-backend-supported chain
  const isNonBackendChain = chainFilter && !isBackendSupportedChainId(chainFilter)

  // Use fallback tokens for non-backend-supported chains
  const fallbackTokens = useMemo(() => {
    if (isNonBackendChain && chainFilter) {
      return getFallbackTokensForChain(chainFilter, searchQuery)
    }
    return null
  }, [isNonBackendChain, chainFilter, searchQuery])

  return useMemo(() => {
    // If we have a backend error on a non-backend-supported chain, use fallback tokens
    if (isNonBackendChain && error && fallbackTokens) {
      return {
        data: fallbackTokens,
        loading: false,
        error: undefined,
        refetch,
      }
    }

    // For backend-supported chains or when no error, use normal backend results
    return {
      data: tokens,
      loading: isPending,
      error: error ?? undefined,
      refetch,
    }
  }, [tokens, isPending, error, refetch, isNonBackendChain, fallbackTokens])
}
