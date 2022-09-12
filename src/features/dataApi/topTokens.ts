import { Token } from '@uniswap/sdk-core'
import { graphql } from 'babel-plugin-relay/macro'
import { useMemo } from 'react'
import { useLazyLoadQuery } from 'react-relay-offline'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { topTokensQuery } from 'src/features/dataApi/__generated__/topTokensQuery.graphql'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { fromGraphQLChain } from 'src/utils/chainId'
import { currencyId } from 'src/utils/currencyId'

const query = graphql`
  query topTokensQuery {
    topTokenProjects(orderBy: MARKET_CAP, page: 1, pageSize: 100) {
      name
      logoUrl
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

export function usePopularTokens(): CurrencyInfo[] {
  const { data } = useLazyLoadQuery<topTokensQuery>(query, {})

  return useMemo(() => {
    if (!data || !data.topTokenProjects) return EMPTY_ARRAY

    const tokens = data.topTokenProjects
      .flatMap((project) =>
        project?.tokens.map((token) => {
          const { chain, address, decimals, symbol, name } = token
          const chainId = fromGraphQLChain(chain)
          if (!chainId || !decimals || !symbol || !name) return null

          const currency = address
            ? new Token(chainId, address, decimals, symbol.toLocaleUpperCase(), name)
            : new NativeCurrency(chainId)

          const currencyInfo: CurrencyInfo = {
            currency,
            currencyId: currencyId(currency),
            logoUrl: project.logoUrl,
          }

          return currencyInfo
        })
      )
      .filter(Boolean) as CurrencyInfo[]

    return tokens
  }, [data])
}
