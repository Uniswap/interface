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
  query spotPricesQuery($contracts: [ContractInput!]!) {
    tokenProjects(contracts: $contracts) {
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

/** Retrieves spot price of a single currency */
export function useSpotPrice(currency: NullUndefined<Currency>) {
  const data = useLazyLoadQuery<spotPricesQuery>(
    query,
    {
      contracts: [
        {
          chain: toGraphQLChain(currency?.chainId ?? ChainId.Mainnet) ?? 'ETHEREUM',
          address: currency?.wrapped.address.toLowerCase(),
        },
      ],
    },
    { networkCacheConfig: { poll: PollingInterval.Slow } }
  )

  return data.tokenProjects?.[0]?.markets?.[0]
}
