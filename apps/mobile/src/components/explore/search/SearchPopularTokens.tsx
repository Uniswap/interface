import { TokenRankingsStat } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import React, { useMemo } from 'react'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { SearchTokenItem } from 'src/components/explore/search/items/SearchTokenItem'
import { getSearchResultId } from 'src/components/explore/search/utils'
import { Flex, Loader } from 'ui/src'
import { ALL_NETWORKS_ARG } from 'uniswap/src/data/rest/base'
import { useTokenRankingsQuery } from 'uniswap/src/data/rest/tokenRankings'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { SearchResultType, TokenSearchResult } from 'uniswap/src/features/search/SearchResult'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { RankingType } from 'wallet/src/features/wallet/types'

const MAX_TOKEN_RESULTS_AMOUNT = 8

function tokenStatsToTokenSearchResult(token: Maybe<TokenRankingsStat>): TokenSearchResult | null {
  if (!token) {
    return null
  }

  const { chain, address, symbol, name, logo } = token
  const chainId = fromGraphQLChain(chain)

  if (!chainId || !symbol || !name) {
    return null
  }

  return {
    type: SearchResultType.Token,
    chainId,
    address: address ?? null,
    name,
    symbol,
    logoUrl: logo ?? null,
    safetyLevel: null,
  }
}

export function SearchPopularTokens({ selectedChain }: { selectedChain: UniverseChainId | null }): JSX.Element {
  const { data, isLoading } = useTokenRankingsQuery({
    chainId: selectedChain?.toString() ?? ALL_NETWORKS_ARG,
  })

  const popularTokens = data?.tokenRankings?.[RankingType.Popularity]?.tokens.slice(0, MAX_TOKEN_RESULTS_AMOUNT)

  const formattedTokens = useMemo(
    () => popularTokens?.map(tokenStatsToTokenSearchResult).filter((t): t is TokenSearchResult => Boolean(t)),
    [popularTokens],
  )

  if (isLoading) {
    return (
      <Flex px="$spacing24" py="$spacing8">
        <Loader.Token repeat={2} />
      </Flex>
    )
  }

  return <FlatList data={formattedTokens} keyExtractor={getSearchResultId} renderItem={renderTokenItem} />
}

const renderTokenItem = ({ item }: ListRenderItemInfo<TokenSearchResult>): JSX.Element => (
  <SearchTokenItem token={item} />
)
