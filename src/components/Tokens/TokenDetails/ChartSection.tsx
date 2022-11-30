import { ParentSize } from '@visx/responsive'
import { ChartContainer, LoadingChart } from 'components/Tokens/TokenDetails/Skeleton'
import { TokenPriceQuery, tokenPriceQuery } from 'graphql/data/TokenPrice'
import { isPricePoint, PricePoint } from 'graphql/data/util'
import { TimePeriod } from 'graphql/data/util'
import { useAtomValue } from 'jotai/utils'
import { startTransition, Suspense, useMemo, useState } from 'react'
import { PreloadedQuery, usePreloadedQuery } from 'react-relay'

import { filterTimeAtom } from '../state'
import PriceChart from './PriceChart'
import TimePeriodSelector from './TimeSelector'

function usePreloadedTokenPriceQuery(priceQueryReference: PreloadedQuery<TokenPriceQuery>): PricePoint[] | undefined {
  const queryData = usePreloadedQuery(tokenPriceQuery, priceQueryReference)

  // Appends the current price to the end of the priceHistory array
  const priceHistory = useMemo(() => {
    const market = queryData.tokens?.[0]?.market
    const priceHistory = market?.priceHistory?.filter(isPricePoint)
    const currentPrice = market?.price?.value
    if (Array.isArray(priceHistory) && currentPrice !== undefined) {
      const timestamp = Date.now() / 1000
      return [...priceHistory, { timestamp, value: currentPrice }]
    }
    return priceHistory
  }, [queryData])

  return priceHistory
}
export default function ChartSection({
  priceQueryReference,
  refetchTokenPrices,
}: {
  priceQueryReference: PreloadedQuery<TokenPriceQuery> | null | undefined
  refetchTokenPrices: RefetchPricesFunction
}) {
  if (!priceQueryReference) {
    return <LoadingChart />
  }

  return (
    <Suspense fallback={<LoadingChart />}>
      <ChartContainer>
        <Chart priceQueryReference={priceQueryReference} refetchTokenPrices={refetchTokenPrices} />
      </ChartContainer>
    </Suspense>
  )
}

export type RefetchPricesFunction = (t: TimePeriod) => void
function Chart({
  priceQueryReference,
  refetchTokenPrices,
}: {
  priceQueryReference: PreloadedQuery<TokenPriceQuery>
  refetchTokenPrices: RefetchPricesFunction
}) {
  const prices = usePreloadedTokenPriceQuery(priceQueryReference)
  // Initializes time period to global & maintain separate time period for subsequent changes
  const [timePeriod, setTimePeriod] = useState(useAtomValue(filterTimeAtom))

  return (
    <ChartContainer>
      <ParentSize>
        {({ width }) => <PriceChart prices={prices ?? null} width={width} height={436} timePeriod={timePeriod} />}
      </ParentSize>
      <TimePeriodSelector
        currentTimePeriod={timePeriod}
        onTimeChange={(t: TimePeriod) => {
          startTransition(() => refetchTokenPrices(t))
          setTimePeriod(t)
        }}
      />
    </ChartContainer>
  )
}
