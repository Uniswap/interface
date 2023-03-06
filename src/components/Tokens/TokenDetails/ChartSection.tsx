import { ParentSize } from '@visx/responsive'
import { ChartContainer, LoadingChart } from 'components/Tokens/TokenDetails/Skeleton'
import { TokenPriceQuery } from 'graphql/data/TokenPrice'
import { isPricePoint, PricePoint } from 'graphql/data/util'
import { TimePeriod } from 'graphql/data/util'
import { Suspense, useMemo } from 'react'

import { PriceChart } from './PriceChart'

function usePriceHistory(tokenPriceData: any): PricePoint[] | undefined {
  // Appends the current price to the end of the priceHistory array
  const priceHistory = useMemo(() => {
    const market = tokenPriceData
    const priceHistory = market?.filter(isPricePoint)
    const currentPrice = market[0].value

    if (Array.isArray(priceHistory) && currentPrice !== undefined) {
      const timestamp = Date.now() / 1000
      return [...priceHistory.reverse(), { timestamp, value: currentPrice }]
    }
    return priceHistory
  }, [tokenPriceData])

  return priceHistory
}
export default function ChartSection({
  tokenPriceQuery,
  onChangeTimePeriod,
}: {
  tokenPriceQuery: any
  onChangeTimePeriod: OnChangeTimePeriod
}) {
  if (!tokenPriceQuery) {
    return <LoadingChart />
  }

  return (
    <Suspense fallback={<LoadingChart />}>
      <ChartContainer>
        <Chart tokenPriceQuery={tokenPriceQuery} onChangeTimePeriod={onChangeTimePeriod} />
      </ChartContainer>
    </Suspense>
  )
}

export type OnChangeTimePeriod = (t: TimePeriod) => void
function Chart({
  tokenPriceQuery,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChangeTimePeriod,
}: {
  tokenPriceQuery: TokenPriceQuery
  onChangeTimePeriod: OnChangeTimePeriod
}) {
  const prices = usePriceHistory(tokenPriceQuery)
  // Initializes time period to global & maintain separate time period for subsequent changes
  const timePeriod = 2

  return (
    <ChartContainer data-testid="chart-container">
      <ParentSize>
        {({ width }) => <PriceChart prices={prices ?? null} width={width} height={436} timePeriod={timePeriod} />}
      </ParentSize>
    </ChartContainer>
  )
}
