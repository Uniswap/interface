import React, { useMemo } from 'react'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { SearchTokenItem } from 'src/components/explore/search/items/SearchTokenItem'
import { getSearchResultId } from 'src/components/explore/search/utils'
import { Loader } from 'src/components/loading'
import { SearchResultType, TokenSearchResult } from 'src/features/explore/SearchResult'
import { TopToken, usePopularTokens } from 'src/features/tokens/hooks'
import { Inset } from 'ui/src'
import { fromGraphQLChain } from 'wallet/src/features/chains/utils'

function gqlTokenToTokenSearchResult(token: Maybe<TopToken>): TokenSearchResult | null {
  if (!token || !token.project) return null

  const { chain, address, symbol, project } = token
  const { name } = project
  const chainId = fromGraphQLChain(chain)
  if (!chainId || !symbol || !name) return null

  return {
    type: SearchResultType.Token,
    chainId,
    address,
    name,
    symbol,
    logoUrl: project?.logoUrl,
  } as TokenSearchResult
}

export function SearchPopularTokens(): JSX.Element {
  const { popularTokens, loading } = usePopularTokens()
  const tokens = useMemo(
    () =>
      popularTokens
        ?.map(gqlTokenToTokenSearchResult)
        .filter((t): t is TokenSearchResult => Boolean(t)),
    [popularTokens]
  )

  if (loading) {
    return (
      <Inset all="$spacing8">
        <Loader.Token repeat={2} />
      </Inset>
    )
  }

  return <FlatList data={tokens} keyExtractor={getSearchResultId} renderItem={renderTokenItem} />
}

const renderTokenItem = ({ item }: ListRenderItemInfo<TokenSearchResult>): JSX.Element => (
  <SearchTokenItem token={item} />
)
