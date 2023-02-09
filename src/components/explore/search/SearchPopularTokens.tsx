import React, { useMemo } from 'react'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { SearchTokenItem } from 'src/components/explore/search/items/SearchTokenItem'
import { Inset } from 'src/components/layout'
import { Loader } from 'src/components/loading'
import { ChainId } from 'src/constants/chains'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { WRAPPED_NATIVE_CURRENCY } from 'src/constants/tokens'
import {
  Chain,
  SearchPopularTokensQuery,
  useSearchPopularTokensQuery,
} from 'src/data/__generated__/types-and-hooks'
import { SearchResultType, TokenSearchResult } from 'src/features/explore/searchHistorySlice'
import { areAddressesEqual } from 'src/utils/addresses'
import { fromGraphQLChain } from 'src/utils/chainId'
import { buildCurrencyId, buildNativeCurrencyId } from 'src/utils/currencyId'

export function SearchPopularTokens(): JSX.Element {
  // Load popular tokens by top Uniswap trading volume
  const { data, loading } = useSearchPopularTokensQuery()

  const popularTokens = useMemo(() => {
    if (!data || !data.topTokens) return EMPTY_ARRAY

    // special case to replace weth with eth because the backend does not return eth data
    // eth will be defined only if all the required data is available
    // when eth data is not fully available, we do not replace weth with eth
    const eth = data?.eth && data?.eth.length > 0 && data?.eth?.[0]?.project ? data.eth[0] : null
    const weth = WRAPPED_NATIVE_CURRENCY[ChainId.Mainnet]

    return data.topTokens
      .map((token) => {
        if (!token) return

        const isWeth =
          areAddressesEqual(token.address, weth.address) && token?.chain === Chain.Ethereum

        // manually replace weth with eth given backend only returns eth data as a proxy for eth
        if (isWeth && eth) {
          return gqlTokenToTokenSearchResult(eth)
        }

        return gqlTokenToTokenSearchResult(token)
      })
      .filter((t): t is TokenSearchResult => Boolean(t))
  }, [data])

  if (loading) {
    return (
      <Inset all="spacing8">
        <Loader.Token repeat={3} />
      </Inset>
    )
  }

  return (
    <FlatList
      data={popularTokens}
      keyExtractor={tokenKey}
      listKey="tokens"
      renderItem={renderTokenItem}
    />
  )
}

function gqlTokenToTokenSearchResult(
  token: NullUndefined<NonNullable<NonNullable<SearchPopularTokensQuery['topTokens']>[0]>>
): TokenSearchResult | null {
  if (!token || !token.project) return null

  const { chain, address, symbol, name, project } = token
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

const renderTokenItem = ({ item }: ListRenderItemInfo<TokenSearchResult>): JSX.Element => (
  <SearchTokenItem token={item} />
)

const tokenKey = (token: TokenSearchResult): string => {
  return token.address
    ? buildCurrencyId(token.chainId, token.address)
    : buildNativeCurrencyId(token.chainId)
}
