import graphql from 'babel-plugin-relay/macro'
import { fetchQuery } from 'react-relay'

import { SearchTokenQuery } from './__generated__/SearchTokenQuery.graphql'
import environment from './RelayEnvironment'
import { chainIdToBackendName } from './util'

export const searchTokenQuery = graphql`
  query SearchTokenQuery($searchQuery: String!) {
    searchTokenProjects(searchQuery: $searchQuery) {
      tokens {
        id @required(action: LOG)
        decimals @required(action: LOG)
        name @required(action: LOG)
        chain @required(action: LOG)
        standard @required(action: LOG)
        address
        symbol @required(action: LOG)
        market(currency: USD) {
          price {
            value
            currency
          }
          pricePercentChange(duration: DAY) {
            value
          }
          volume24H: volume(duration: DAY) {
            value
            currency
          }
        }
      }
      logoUrl
    }
  }
`

export type SearchTokenProject = NonNullable<NonNullable<SearchTokenQuery['response']['searchTokenProjects']>[number]>
export type SearchToken = NonNullable<NonNullable<SearchTokenProject['tokens']>[number]>

export async function searchTokens(
  searchQuery: string,
  chainId: number
): Promise<(SearchToken & { logoURI: string })[]> {
  const searchChain = chainIdToBackendName(chainId)
  const response = await fetchQuery<SearchTokenQuery>(
    environment,
    searchTokenQuery,
    { searchQuery },
    { fetchPolicy: 'store-or-network', networkCacheConfig: { force: false } }
  ).toPromise()
  const tokenProjects = response?.searchTokenProjects?.filter((p): p is SearchTokenProject => p !== null)
  // Todo: reduce this logic once it's handled by backend
  const tokens = tokenProjects
    ?.map((p) => {
      let selectedToken: SearchToken | null = p.tokens?.[0]
      let nativeToken: SearchToken | null = null
      // Selects which chain's token to display, based on relevancy
      p.tokens.forEach((t) => {
        // Handles special case of preferring natives regardless of chain,
        // i.e. showing Polygon MATIC over mainnet MATIC
        if (t?.standard === 'NATIVE') {
          if (!nativeToken || t.chain === searchChain) nativeToken = t
        }
        if (t?.chain === searchChain) selectedToken = t
      })
      return { ...(nativeToken ?? selectedToken), logoURI: p.logoUrl }
    })
    .filter((t): t is SearchToken & { logoURI: string } => t !== null)

  return tokens ?? []
}
