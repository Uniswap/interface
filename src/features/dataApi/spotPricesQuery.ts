import { Currency } from '@uniswap/sdk-core'
import { graphql } from 'babel-plugin-relay/macro'
import { useLazyLoadQuery } from 'react-relay'
import { ChainId } from 'src/constants/chains'
import { PollingInterval } from 'src/constants/misc'
import {
  spotPricesQuery,
  spotPricesQuery$data,
} from 'src/features/dataApi/__generated__/spotPricesQuery.graphql'
import { toGraphQLChain } from 'src/utils/chainId'

export type SpotPrice = NonNullable<
  NonNullable<NonNullable<spotPricesQuery$data['tokenProjects']>[0]>['markets']
>[0]

const query = graphql`
  query spotPricesQuery($contracts: [ContractInput!]!, $skip: Boolean!) {
    tokenProjects(contracts: $contracts) @skip(if: $skip) {
      markets(currencies: [USD]) {
        price {
          value
        }
        pricePercentChange24h {
          value
        }
      }
    }
  }
`

/**
 * Fetches spot price of a single currency. When used, wrap component
 * with Suspense.
 */
export function useSpotPrice(currency: NullUndefined<Currency>, skip?: boolean) {
  const data = useLazyLoadQuery<spotPricesQuery>(
    query,
    {
      contracts: [
        {
          chain: toGraphQLChain(currency?.chainId ?? ChainId.Mainnet) ?? 'ETHEREUM',
          address: currency?.wrapped.address.toLowerCase(),
        },
      ],
      skip: Boolean(skip),
    },
    { networkCacheConfig: { poll: PollingInterval.Normal } }
  )

  return data?.tokenProjects?.[0]?.markets?.[0]
}
