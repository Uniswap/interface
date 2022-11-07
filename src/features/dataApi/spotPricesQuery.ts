import { Currency } from '@uniswap/sdk-core'
import { PollingInterval } from 'src/constants/misc'
import { SpotPricesQuery, useSpotPricesQuery } from 'src/data/__generated__/types-and-hooks'
import { GqlResult } from 'src/features/dataApi/types'
import { currencyIdToContractInput } from 'src/features/dataApi/utils'
import { currencyId } from 'src/utils/currencyId'

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
      contracts: [currencyIdToContractInput(currencyId(currency!))],
    },
    pollInterval: PollingInterval.Fast,
    skip: skip || !currency,
  })

  return { data: data?.tokenProjects?.[0]?.markets?.[0], loading }
}
