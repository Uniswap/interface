import { ParentSize } from '@visx/responsive'
import { ChartContainer, LoadingChart } from 'components/Tokens/TokenDetails/Skeleton'
import { TokenPriceQuery } from 'graphql/data/TokenPrice'
import { isPricePoint, PricePoint } from 'graphql/data/util'
import { TimePeriod } from 'graphql/data/util'
import { useAtomValue } from 'jotai/utils'
import { pageTimePeriodAtom } from 'pages/TokenDetails'
import { startTransition, Suspense, useMemo } from 'react'

import { PriceChart } from './PriceChart'
import TimePeriodSelector from './TimeSelector'

function usePriceHistory(tokenPriceData: TokenPriceQuery): PricePoint[] | undefined {
  // Appends the current price to the end of the priceHistory array
  const priceHistory = useMemo(() => {
    const market = tokenPriceData.token?.market
    const priceHistory = market?.priceHistory?.filter(isPricePoint)
    const currentPrice = market?.price?.value
    if (Array.isArray(priceHistory) && currentPrice !== undefined) {
      const timestamp = Date.now() / 1000
      return [...priceHistory, { timestamp, value: currentPrice }]
    }
    return priceHistory
  }, [tokenPriceData])

  return priceHistory
}
export default function ChartSection({
  tokenPriceQuery,
  onChangeTimePeriod,
}: {
  tokenPriceQuery?: TokenPriceQuery
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

export function PairChartSection(
  {
    token0PriceQuery,
    token1PriceQuery,
    onChangeTimePeriod,
    token0symbol = "UNK",
    token1symbol = "UNK"
  }: {
    token0PriceQuery?: TokenPriceQuery
    token1PriceQuery?: TokenPriceQuery
    onChangeTimePeriod: OnChangeTimePeriod
    token0symbol?: string
    token1symbol?: string
  }
) {
  if (!token0PriceQuery || !token1PriceQuery) {
    return <LoadingChart />
  }

  return (
    <Suspense fallback={<LoadingChart />}>
      <ChartContainer>
        <PairChart token0PriceQuery={token0PriceQuery} token1PriceQuery={token1PriceQuery} onChangeTimePeriod={onChangeTimePeriod} token0symbol={token0symbol} token1symbol={token1symbol}/>
      </ChartContainer>
    </Suspense>
  )
}

export type OnChangeTimePeriod = (t: TimePeriod) => void
function Chart({
  tokenPriceQuery,
  onChangeTimePeriod,
}: {
  tokenPriceQuery: TokenPriceQuery
  onChangeTimePeriod: OnChangeTimePeriod
}) {
  const prices = usePriceHistory(tokenPriceQuery)
  // Initializes time period to global & maintain separate time period for subsequent changes
  const timePeriod = useAtomValue(pageTimePeriodAtom)

  return (
    <ChartContainer data-testid="chart-container">
      <ParentSize>
        {({ width }) => <PriceChart prices={prices ?? null} width={width} height={436} timePeriod={timePeriod} />}
      </ParentSize>
      <TimePeriodSelector
        currentTimePeriod={timePeriod}
        onTimeChange={(t: TimePeriod) => {
          startTransition(() => onChangeTimePeriod(t))
        }}
      />
    </ChartContainer>
  )
}

function PairChart({
  token0PriceQuery,
  token1PriceQuery,
  onChangeTimePeriod,
  token0symbol,
  token1symbol
}: {
  token0PriceQuery: TokenPriceQuery
  token1PriceQuery: TokenPriceQuery
  onChangeTimePeriod: OnChangeTimePeriod
  token0symbol: string
  token1symbol: string
}) {
  const prices0 = usePriceHistory(token0PriceQuery)
  const prices1 = usePriceHistory(token1PriceQuery)
  const timePeriod = useAtomValue(pageTimePeriodAtom)

  const prices = useMemo(() => {
    if (prices0 && prices1) {
      return prices0.map((price0, i) => {
        const price1 = prices1[i]
        return {
          timestamp: price0.timestamp,
          value: price0.value / price1.value
        }
      })
    }
    return null
  }, [prices0, prices1])

  const priceFormat = useMemo(() => {
    const f = (price: string) => {
      if (price === '-') {
        return price
      }
      price = price.replace('$', '')
      return `${price} ${token0symbol}/${token1symbol}`
    }
    return f
  }, [token0PriceQuery, token1PriceQuery])


  return (
    <ChartContainer data-testid="chart-container">
      <ParentSize>
        {({ width }) => <PriceChart prices={prices} width={width} height={436} timePeriod={timePeriod} priceFormatBool={true} priceFormat={priceFormat}/>}
      </ParentSize>
      <TimePeriodSelector
        currentTimePeriod={timePeriod}
        onTimeChange={(t: TimePeriod) => {
          startTransition(() => onChangeTimePeriod(t))
        }}
      />
    </ChartContainer>
  )
}
