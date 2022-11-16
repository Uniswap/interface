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
export type SearchToken = NonNullable<NonNullable<SearchTokenProject['tokens']>[number]> & { logoURI: string }

export async function searchTokens(searchQuery: string, chainId: number) {
  const searchChain = chainIdToBackendName(chainId)
  const response = await fetchQuery<SearchTokenQuery>(
    environment,
    searchTokenQuery,
    { searchQuery },
    { fetchPolicy: 'store-or-network', networkCacheConfig: { force: false } }
  ).toPromise()
  const tokenProjects = response?.searchTokenProjects?.filter((p): p is SearchTokenProject => p !== null)
  const tokens = tokenProjects
    ?.map((p) => {
      const correctChainToken = p.tokens.find((t) => t?.chain && t.chain === searchChain)
      return correctChainToken ? { ...correctChainToken, logoURI: p.logoUrl } : { ...p.tokens?.[0], logoURI: p.logoUrl }
    })
    .filter((t): t is SearchToken => t !== null)

  return tokens ?? []
}
