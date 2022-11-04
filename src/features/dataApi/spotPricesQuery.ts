import { Currency } from '@uniswap/sdk-core'
import { ChainId } from 'src/constants/chains'
import { Chain, SpotPricesQuery, useSpotPricesQuery } from 'src/data/__generated__/types-and-hooks'
import { GqlResult } from 'src/features/dataApi/types'
import { toGraphQLChain } from 'src/utils/chainId'

export type SpotPrice = NonNullable<
  NonNullable<NonNullable<SpotPricesQuery['tokenProjects']>[0]>['markets']
>[0]

/**
 * Fetches spot price of a single currency. When used, wrap component
 * with Suspense.
 */
export function useSpotPrice(
  currency: NullUndefined<Currency>,
  skip?: boolean
): GqlResult<SpotPrice> {
  const { data, loading } = useSpotPricesQuery({
    variables: {
      contracts: [
        {
          chain: toGraphQLChain(currency?.chainId ?? ChainId.Mainnet) ?? Chain.Ethereum,
          address: currency?.wrapped.address.toLowerCase(),
        },
      ],
    },
    skip,
  })

  return { data: data?.tokenProjects?.[0]?.markets?.[0], loading }
}
