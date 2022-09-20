import { graphql } from 'babel-plugin-relay/macro'
import { useMemo } from 'react'
import { useLazyLoadQuery } from 'react-relay-offline'
import { EMPTY_ARRAY, PollingInterval } from 'src/constants/misc'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { tokenProjectToCurrencyInfos } from 'src/features/dataApi/utils'
import { topTokensQuery } from 'src/features/dataApi/__generated__/topTokensQuery.graphql'

const query = graphql`
  query topTokensQuery {
    topTokenProjects(orderBy: MARKET_CAP, page: 1, pageSize: 100) {
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
  const { data } = useLazyLoadQuery<topTokensQuery>(
    query,
    {},
    { networkCacheConfig: { poll: PollingInterval.Fast } }
  )

  return useMemo(() => {
    if (!data || !data.topTokenProjects) return EMPTY_ARRAY

    return tokenProjectToCurrencyInfos(data.topTokenProjects)
  }, [data])
}
