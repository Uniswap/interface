import React, { useMemo } from 'react'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { SearchTokenItem } from 'src/components/explore/search/items/SearchTokenItem'
import { getSearchResultId } from 'src/components/explore/search/utils'
import { Flex, Loader } from 'ui/src'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { getCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils'
import { SearchResultType, TokenSearchResult } from 'uniswap/src/features/search/SearchResult'
import { TopToken, usePopularTokens } from 'uniswap/src/features/tokens/hooks'

function gqlTokenToTokenSearchResult(token: Maybe<TopToken>): TokenSearchResult | null {
  if (!token || !token.project) {
    return null
  }

  const { name, chain, address, symbol, project, protectionInfo } = token
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
    logoUrl: project?.logoUrl ?? null,
    safetyLevel: project?.safetyLevel ?? null,
    safetyInfo: getCurrencySafetyInfo(project.safetyLevel, protectionInfo),
  }
}

export function SearchPopularTokens(): JSX.Element {
  const { popularTokens, loading } = usePopularTokens()
  const tokens = useMemo(
    () => popularTokens?.map(gqlTokenToTokenSearchResult).filter((t): t is TokenSearchResult => Boolean(t)),
    [popularTokens],
  )

  if (loading) {
    return (
      <Flex px="$spacing24" py="$spacing8">
        <Loader.Token repeat={2} />
      </Flex>
    )
  }

  return <FlatList data={tokens} keyExtractor={getSearchResultId} renderItem={renderTokenItem} />
}

const renderTokenItem = ({ item }: ListRenderItemInfo<TokenSearchResult>): JSX.Element => (
  <SearchTokenItem token={item} />
)
