import { getFewTokenAddress } from '@ring-protocol/few-v2-sdk'
import { useRingExploreStatsQuery } from 'appGraphql/data/ring/useRingExploreStats'
import { useRingProtocolStatsQuery } from 'appGraphql/data/ring/useRingProtocolStats'
import { useSearchRingWebQuery } from 'appGraphql/data/ring/useSearchRingWebQuery'
import { unwrapFewToken } from 'appGraphql/data/util'
import { ZERO_ADDRESS } from 'constants/misc'
import { useCallback, useMemo } from 'react'
import { useDefaultRingActiveTokens } from 'state/lists/hooks'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { OnchainItemListOptionType, PoolOption, SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { ProtocolVersion } from 'uniswap/src/data/graphql/ringswap-data-api/__generated__/types-and-hooks'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { searchTokenToCurrencyInfo } from 'uniswap/src/data/rest/searchTokens'
import { GqlResult } from 'uniswap/src/data/types'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { isAddress } from 'utilities/src/addresses'
import noop from 'utilities/src/react/noop'

function useSearchRingRestQuery({
  searchQuery = '',
  chain,
}: {
  searchQuery: string
  chain: Chain
}): GqlResult<{ tokens: CurrencyInfo[]; pools: PoolOption[] }> {
  const chainId = fromGraphQLChain(chain)

  // Try to convert origintoken address to fewtoken address (for address inputs).
  // For non-address inputs (symbol/name), keep using the original search string.
  const fewTokenSearchQuery = useMemo(() => {
    if (!searchQuery || !chainId) {
      return ''
    }
    const validAddress = isAddress(searchQuery)
    if (!validAddress) {
      // Not an address: use the original search string (symbol/name search)
      return searchQuery
    }
    try {
      const fewTokenAddress = getFewTokenAddress(validAddress, chainId)
      // If fewtoken address is 0 address, it means fewtoken doesn't exist
      if (fewTokenAddress.toLowerCase() === ZERO_ADDRESS.toLowerCase()) {
        // FEW token doesn't exist: we currently do not fallback to originToken address
        return ''
      }
      return fewTokenAddress
    } catch {
      return ''
    }
  }, [searchQuery, chainId])

  // Determine if we should query (either by FEW token address or by original non-address search string)
  const shouldQueryFewToken = useMemo(() => {
    return fewTokenSearchQuery !== ''
  }, [fewTokenSearchQuery])

  // Query fewtoken address
  const {
    data: fewTokenData,
    loading: fewTokenLoading,
    error: fewTokenError,
    refetch: refetchFewToken,
  } = useSearchRingWebQuery({
    variables: { searchQuery: fewTokenSearchQuery, chain },
    skip: !shouldQueryFewToken,
  })

  // TODO: Support origintoken query if needed in the future
  // const shouldQueryOriginal = useMemo(() => {
  //   // Always query original address
  //   return searchQuery !== ''
  // }, [searchQuery])
  //
  // const {
  //   data: originalData,
  //   loading: originalLoading,
  //   error: originalError,
  //   refetch: refetchOriginal,
  // } = useSearchRingWebQuery({
  //   variables: { searchQuery, chain },
  //   skip: !shouldQueryOriginal,
  // })

  // Use fewtoken query results
  const data = fewTokenData

  const loading = fewTokenLoading
  const error = fewTokenError
  const refetch = useCallback(() => {
    refetchFewToken?.()
    // refetchOriginal?.()
  }, [refetchFewToken])
  const ringTokens = useDefaultRingActiveTokens(chainId)

  const formattedData = useMemo(() => {
    if (!data || !data.tokens.items) {
      return undefined
    }

    return data.tokens.items
      .map((token: any) => {
        const tokenInfo = Object.values(ringTokens).find(
          (item) => item.address.toLowerCase() === token?.originToken?.address?.toLowerCase(),
        ) as any
        const unwrappedToken = unwrapFewToken(chainId ?? UniverseChainId.Mainnet, token, tokenInfo?.logoURI)
        return searchTokenToCurrencyInfo(unwrappedToken)
      })
      .filter((c: any): c is CurrencyInfo => Boolean(c))
  }, [data, ringTokens, chainId])

  const mergedPoolData = useMemo(() => {
    const v2Pairs = data?.v2Pairs?.items || []
    const v3Pools = data?.v3Pools?.items || []
    const v4Pools = data?.v4Pools?.items || []
    return [...v2Pairs, ...v3Pools, ...v4Pools]
  }, [data])

  const formettedPoolData = useMemo(() => {
    const nativeLogo = getChainInfo(chainId ?? UniverseChainId.Mainnet).nativeCurrency.logo
    return mergedPoolData.map((pool) => {
      const token0Info = Object.values(ringTokens).find(
        (item) => item.address.toLowerCase() === pool.token0?.originToken?.address?.toLowerCase(),
      ) as any
      const token1Info = Object.values(ringTokens).find(
        (item) => item.address.toLowerCase() === pool.token1?.originToken?.address?.toLowerCase(),
      ) as any

      const token0 = unwrapFewToken(chainId ?? UniverseChainId.Mainnet, pool.token0, token0Info?.logoURI)
      const token1 = unwrapFewToken(chainId ?? UniverseChainId.Mainnet, pool.token1, token1Info?.logoURI)

      return {
        ...pool,
        type: OnchainItemListOptionType.Pool,
        chainId,
        poolId: pool.protocolVersion == ProtocolVersion.V4 ? pool.poolId : pool.address,
        token0CurrencyInfo: searchTokenToCurrencyInfo({
          ...token0,
          address: token0.isNative ? 'ETH' : token0.address,
          logoUrl: token0.isNative ? nativeLogo : token0Info?.logoURI,
        }),
        token1CurrencyInfo: searchTokenToCurrencyInfo({
          ...token1,
          address: token1.isNative ? 'ETH' : token1.address,
          logoUrl: token1.isNative ? nativeLogo : token1Info?.logoURI,
        }),
        feeTier: 'feeTier' in pool ? pool.feeTier : 3000,
      }
    }) as PoolOption[]
  }, [mergedPoolData, ringTokens, chainId])

  return useMemo(() => {
    return { data: { tokens: formattedData, pools: formettedPoolData }, loading, error, refetch }
  }, [formattedData, formettedPoolData, loading, error, refetch])
}

export function useSectionsForSearchResults(
  chainFilter: Chain | null,
  searchFilter: string | null,
  activeTab: SearchTab,
): GqlResult<OnchainItemSection<SearchModalOption>[]> {
  const {
    data: searchResultCurrencies,
    error: searchTokensError,
    refetch: refetchSearchTokens,
    loading: searchTokensLoading,
  } = useSearchRingRestQuery({
    searchQuery: searchFilter ?? '',
    chain: chainFilter ?? Chain.Ethereum,
  })

  const tokenSearchResults = useCurrencyInfosToTokenOptions({ currencyInfos: searchResultCurrencies?.tokens ?? [] })
  const tokenSearchResultsSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.Tokens,
    options: tokenSearchResults,
  })

  const poolSearchResultsSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.Pools,
    // options: Array(isWeb ? 4 : 0).fill(MOCK_POOL_OPTION_ITEM),
    options: searchResultCurrencies?.pools ?? [],
  })

  const refetchAll = useCallback(() => {
    refetchSearchTokens?.()
  }, [refetchSearchTokens])

  // eslint-disable-next-line complexity
  return useMemo((): GqlResult<OnchainItemSection<SearchModalOption>[]> => {
    switch (activeTab) {
      case SearchTab.All:
        return {
          data: [
            ...(tokenSearchResultsSection ?? []),
            ...(poolSearchResultsSection ?? []),
          ] as OnchainItemSection<SearchModalOption>[],
          loading: searchTokensLoading, // only show loading&error state for loading tokens
          error: (!tokenSearchResults && searchTokensError) || undefined,
          refetch: refetchAll,
        }
      case SearchTab.Tokens:
        return {
          data: tokenSearchResultsSection ?? [],
          loading: searchTokensLoading,
          error: (!tokenSearchResults && searchTokensError) || undefined,
          refetch: refetchSearchTokens,
        }
      case SearchTab.Pools:
        return {
          data: (poolSearchResultsSection ?? []) as OnchainItemSection<SearchModalOption>[],
          loading: false,
          error: undefined,
          refetch: noop,
        }
      default:
      case SearchTab.Wallets:
        return {
          data: [
            ...(tokenSearchResultsSection ?? []),
            ...(poolSearchResultsSection ?? []),
          ] as OnchainItemSection<SearchModalOption>[],
          loading: searchTokensLoading, // only show loading&error state for loading tokens
          error: (!tokenSearchResults && searchTokensError) || undefined,
          refetch: refetchAll,
        }
    }
  }, [
    activeTab,
    poolSearchResultsSection,
    refetchAll,
    refetchSearchTokens,
    searchTokensError,
    searchTokensLoading,
    tokenSearchResults,
    tokenSearchResultsSection,
  ])
}

export function useTrendingTokensCurrencyInfos(chainId: UniverseChainId): GqlResult<CurrencyInfo[]> {
  const chain = toGraphQLChain(chainId)
  const {
    data,
    error: searchTokensError,
    refetch: refetchSearchTokens,
    loading: searchTokensLoading,
  } = useRingProtocolStatsQuery(chain)
  const ringTokens = useDefaultRingActiveTokens(chainId)

  const formattedData = useMemo(() => {
    if (!data || !data.tokens.items) {
      return undefined
    }

    const sortedTokens = [...data.tokens.items].sort(
      (a: any, b: any) => Number(b.tradeVolumeUSD) - Number(a.tradeVolumeUSD),
    )

    return sortedTokens
      .map((token: any) => {
        const tokenInfo = Object.values(ringTokens).find(
          (item) => item.address.toLowerCase() === token?.originToken?.address?.toLowerCase(),
        ) as any
        const unwrappedToken = unwrapFewToken(chainId ?? UniverseChainId.Mainnet, token, tokenInfo?.logoURI)
        return searchTokenToCurrencyInfo(unwrappedToken)
      })
      .filter((c: any): c is CurrencyInfo => Boolean(c))
  }, [data, ringTokens, chainId])

  return useMemo(() => {
    return {
      data: formattedData ?? [],
      loading: searchTokensLoading,
      error: searchTokensError,
      refetch: refetchSearchTokens,
    }
  }, [formattedData, searchTokensLoading, searchTokensError, refetchSearchTokens])
}

export function useTrendingPoolsCurrencyInfos(chainId: UniverseChainId): GqlResult<PoolOption[]> {
  const chain = toGraphQLChain(chainId)
  const {
    data,
    error: searchTokensError,
    refetch: refetchSearchTokens,
    loading: searchTokensLoading,
  } = useRingExploreStatsQuery(chain)

  const ringTokens = useDefaultRingActiveTokens(chainId)

  const mergedPoolData = useMemo(() => {
    const v2Pairs = data?.v2Pairs?.items || []
    const v3Pools = data?.v3Pools?.items || []
    const v4Pools = data?.v4Pools?.items || []
    return [...v2Pairs, ...v3Pools, ...v4Pools].sort(
      (a, b) => Number(b.totalValueLockedUSD) - Number(a.totalValueLockedUSD),
    )
  }, [data])

  const formettedPoolData = useMemo(() => {
    const nativeLogo = getChainInfo(chainId ?? UniverseChainId.Mainnet).nativeCurrency.logo
    return mergedPoolData.map((pool) => {
      const token0Info = Object.values(ringTokens).find(
        (item) => item.address.toLowerCase() === pool.token0?.originToken?.address?.toLowerCase(),
      ) as any
      const token1Info = Object.values(ringTokens).find(
        (item) => item.address.toLowerCase() === pool.token1?.originToken?.address?.toLowerCase(),
      ) as any

      const token0 = unwrapFewToken(chainId ?? UniverseChainId.Mainnet, pool.token0, token0Info?.logoURI)
      const token1 = unwrapFewToken(chainId ?? UniverseChainId.Mainnet, pool.token1, token1Info?.logoURI)

      return {
        ...pool,
        type: OnchainItemListOptionType.Pool,
        chainId,
        poolId: pool.protocolVersion == ProtocolVersion.V4 ? pool.poolId : pool.address,
        token0CurrencyInfo: searchTokenToCurrencyInfo({
          ...token0,
          address: token0.isNative ? 'ETH' : token0.address,
          logoUrl: token0.isNative ? nativeLogo : token0Info?.logoURI,
        }),
        token1CurrencyInfo: searchTokenToCurrencyInfo({
          ...token1,
          address: token1.isNative ? 'ETH' : token1.address,
          logoUrl: token1.isNative ? nativeLogo : token1Info?.logoURI,
        }),
        feeTier: 'feeTier' in pool ? pool.feeTier : 3000,
      }
    }) as PoolOption[]
  }, [mergedPoolData, ringTokens, chainId])

  return useMemo(() => {
    return {
      data: formettedPoolData ?? [],
      loading: searchTokensLoading,
      error: searchTokensError,
      refetch: refetchSearchTokens,
    }
  }, [formettedPoolData, searchTokensLoading, searchTokensError, refetchSearchTokens])
}
