import { Currency, Token } from '@uniswap/sdk-core'
import { graphql } from 'babel-plugin-relay/macro'
import { useMemo } from 'react'
import { useLazyLoadQuery } from 'react-relay'
import { Chain } from 'src/components/TokenDetails/__generated__/TokenDetailsStatsQuery.graphql'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { topTokensQuery } from 'src/features/dataApi/__generated__/topTokensQuery.graphql'
import { ChainIdToCurrencyIdToCurrency } from 'src/features/tokens/types'
import { useAllCurrencies } from 'src/features/tokens/useTokens'
import { getChecksumAddress } from 'src/utils/addresses'
import { fromGraphQLChain } from 'src/utils/chainId'
import { buildCurrencyId, getNativeCurrencyAddressForChain } from 'src/utils/currencyId'

const query = graphql`
  query topTokensQuery {
    topTokenProjects(orderBy: MARKET_CAP, page: 1, pageSize: 100) {
      name
      tokens {
        chain
        address
        decimals
        name
        symbol
      }
    }
  }
`

export function usePopularTokens(): Currency[] {
  const data = useLazyLoadQuery<topTokensQuery>(query, {})
  const tokensByChainId = useAllCurrencies()

  return useMemo(() => {
    if (!data || !data.topTokenProjects) return EMPTY_ARRAY

    const tokens = data.topTokenProjects
      .map((project) => project?.tokens)
      .flat()
      .filter(Boolean) as GqlToken[]

    return tokens
      .map((token) => {
        const currencyDetails = gqlTokenToCurrency(token, tokensByChainId, false)
        return currencyDetails?.currency
      })
      .filter(Boolean) // filter out non valid currency values
  }, [data, tokensByChainId])
}

export type GqlToken = {
  address: string | null
  chain: Chain
  decimals: number | null
  name: string | null
  symbol: string | null
}

export function gqlTokenToCurrency(
  token: GqlToken,
  tokensByChainId: ChainIdToCurrencyIdToCurrency,
  onlyUseKnownCurrencies: boolean = false
): { currency: Currency; currencyId: string } | null {
  const chainId = fromGraphQLChain(token?.chain)
  if (!chainId) return null

  // if token address is null, assume it is the native currency of that chain
  // note this assumption isn't true the other way around. polygon MATIC does have an address!
  const tokenAddress = token.address
    ? getChecksumAddress(token.address)
    : getNativeCurrencyAddressForChain(chainId)
  const currencyId = buildCurrencyId(chainId, tokenAddress)
  const knownCurrency = tokensByChainId[chainId]?.[currencyId]

  if (onlyUseKnownCurrencies && !knownCurrency) return null

  if (knownCurrency) {
    return { currency: knownCurrency, currencyId }
  }

  // TODO: Always returns null since API does not currently return decimal data (https://uniswaplabs.atlassian.net/browse/DATA-201)
  return token.decimals
    ? {
        currency: new Token(
          chainId,
          tokenAddress,
          token.decimals,
          token.symbol ?? undefined,
          token.name ?? undefined
        ),
        currencyId,
      }
    : null
}
