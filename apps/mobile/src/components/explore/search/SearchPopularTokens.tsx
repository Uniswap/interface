import { TokenRankingsStat } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import React, { useMemo } from 'react'
import { ListRenderItemInfo } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { SEARCH_ITEM_PX, SEARCH_ITEM_PY } from 'src/components/explore/search/constants'
import { SearchTokenItem } from 'src/components/explore/search/items/SearchTokenItem'
import { getSearchResultId } from 'src/components/explore/search/utils'
import { Flex, Loader } from 'ui/src'
import { MAX_DEFAULT_POPULAR_TOKEN_RESULTS_AMOUNT } from 'uniswap/src/components/TokenSelector/constants'
import { ProtectionResult } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ALL_NETWORKS_ARG } from 'uniswap/src/data/rest/base'
import { useTokenRankingsQuery } from 'uniswap/src/data/rest/tokenRankings'
import { RankingType } from 'uniswap/src/data/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { SearchResultType, TokenSearchResult } from 'uniswap/src/features/search/SearchResult'

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
    // BE has confirmed that all of these TokenRankingsStat tokens are Verified SafetyLevel, and design confirmed that we can hide the warning icon here
    safetyInfo: {
      tokenList: TokenList.Default,
      attackType: undefined,
      protectionResult: ProtectionResult.Benign,
    },
    feeData: null,
  }
}

export function SearchPopularTokens({ selectedChain }: { selectedChain: UniverseChainId | null }): JSX.Element {
  const { data, isLoading } = useTokenRankingsQuery({
    chainId: selectedChain?.toString() ?? ALL_NETWORKS_ARG,
  })

  const popularTokens = data?.tokenRankings?.[RankingType.Popularity]?.tokens.slice(
    0,
    MAX_DEFAULT_POPULAR_TOKEN_RESULTS_AMOUNT,
  )

  const formattedTokens = useMemo(
    () => popularTokens?.map(tokenStatsToTokenSearchResult).filter((t): t is TokenSearchResult => Boolean(t)),
    [popularTokens],
  )

  if (isLoading) {
    return (
      <Flex px={SEARCH_ITEM_PX} py={SEARCH_ITEM_PY}>
        <Loader.Token repeat={2} />
      </Flex>
    )
  }

  return <FlatList data={formattedTokens} keyExtractor={getSearchResultId} renderItem={renderTokenItem} />
}

const renderTokenItem = ({ item }: ListRenderItemInfo<TokenSearchResult>): JSX.Element => (
  <SearchTokenItem token={item} />
)
