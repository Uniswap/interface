import { PollingInterval } from 'src/constants/misc'
import { SpotPricesQuery, useSpotPricesQuery } from 'src/data/__generated__/types-and-hooks'
import { GqlResult } from 'src/features/dataApi/types'
import { currencyIdToContractInput } from 'src/features/dataApi/utils'

export type SpotPrice = NonNullable<
  NonNullable<NonNullable<SpotPricesQuery['tokenProjects']>[0]>['markets']
>[0]

/** Fetches spot price of a single currency. */
export function useSpotPrice(
  currencyId: NullUndefined<string>,
  skip?: boolean
): GqlResult<SpotPrice> {
  const { data, loading } = useSpotPricesQuery({
    // query is re-used by multiple components
    // attempt to load from cache instead of always sending a request (default)
    fetchPolicy: 'cache-first',
    pollInterval: PollingInterval.Fast,
    skip: skip || !currencyId,
    // also assert non-null value in `skip`
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    variables: { contracts: [currencyIdToContractInput(currencyId!)] },
  })

  return { data: data?.tokenProjects?.[0]?.markets?.[0], loading }
}
