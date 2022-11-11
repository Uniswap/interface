import React, { useMemo } from 'react'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { SearchTokenItem } from 'src/components/explore/search/items/SearchTokenItem'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { useSearchPopularTokensQuery } from 'src/data/__generated__/types-and-hooks'
import { SearchResultType, TokenSearchResult } from 'src/features/explore/searchHistorySlice'
import { fromGraphQLChain } from 'src/utils/chainId'
import { buildCurrencyId, buildNativeCurrencyId } from 'src/utils/currencyId'

export function SearchPopularTokens() {
  // Load popular tokens by top trading volume
  const { data } = useSearchPopularTokensQuery()

  const popularTokens = useMemo(() => {
    if (!data || !data.topTokenProjects) return EMPTY_ARRAY

    return data.topTokenProjects
      .map((tokenProject) => {
        if (!tokenProject) return null

        // Only use first chain the token is on
        const token = tokenProject.tokens[0]
        const { chain, address, symbol, name } = token
        const chainId = fromGraphQLChain(chain)

        if (!chainId || !symbol || !name) return null

        return {
          type: SearchResultType.Token,
          chainId,
          address,
          name,
          symbol,
          logoUrl: tokenProject.logoUrl,
        } as TokenSearchResult
      })
      .filter(Boolean)
  }, [data])

  return (
    <FlatList
      data={popularTokens}
      keyExtractor={tokenKey}
      listKey="tokens"
      renderItem={renderTokenItem}
    />
  )
}

const renderTokenItem = ({ item }: ListRenderItemInfo<TokenSearchResult>) => (
  <SearchTokenItem token={item} />
)

const tokenKey = (token: TokenSearchResult) => {
  return token.address
    ? buildCurrencyId(token.chainId, token.address)
    : buildNativeCurrencyId(token.chainId)
}
