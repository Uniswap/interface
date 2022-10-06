import { graphql } from 'babel-plugin-relay/macro'
import { useMemo } from 'react'
import { useLazyLoadQuery } from 'react-relay'
import { ChainId } from 'src/constants/chains'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { tokenProjectToCurrencyInfos } from 'src/features/dataApi/utils'
import { searchTokensProjectsQuery } from 'src/features/dataApi/__generated__/searchTokensProjectsQuery.graphql'

const query = graphql`
  query searchTokensProjectsQuery($searchQuery: String!, $skip: Boolean!) {
    searchTokenProjects(searchQuery: $searchQuery) @skip(if: $skip) {
      logoUrl
      name
      tokens {
        chain
        address
        decimals
        symbol
      }
    }
  }
`

export function useSearchTokens(
  searchQuery: string | null,
  chainFilter: ChainId | null,
  skip: boolean
): CurrencyInfo[] {
  const data = useLazyLoadQuery<searchTokensProjectsQuery>(query, {
    searchQuery: searchQuery ?? '',
    skip,
  })

  return useMemo(() => {
    if (!data || !data.searchTokenProjects) return EMPTY_ARRAY

    return tokenProjectToCurrencyInfos(data.searchTokenProjects, chainFilter)
  }, [data, chainFilter])
}
