import { ParentSize } from '@visx/responsive'
import { ChartContainer, LoadingChart } from 'components/Tokens/TokenDetails/Skeleton'
import dayjs from 'dayjs'
import { PricePoint } from 'graphql/data/util'
import { TimePeriod } from 'graphql/data/util'
import { fetchTokenPriceData } from 'graphql/tokens/NewTokenPrice'
import { TokenData } from 'graphql/tokens/TokenData'
import { useAtomValue } from 'jotai/utils'
import { pageTimePeriodAtom } from 'pages/TokenDetails'
import { startTransition, Suspense, useEffect, useMemo, useState } from 'react'
import { PriceChartEntry } from 'types/chart'
import { ONE_HOUR_SECONDS } from 'utils/intervals'

import { PriceChart } from './PriceChart'
import TimePeriodSelector from './TimeSelector'

function usePriceHistory(tokenData: TokenData, timePeriod: TimePeriod): PricePoint[] | undefined {
  // Appends the current price to the end of the priceHistory array

  const utcCurrentTime = dayjs()

  const startTimestamp = useMemo(() => {
    switch (timePeriod) {
      case TimePeriod.DAY:
        return utcCurrentTime.subtract(1, 'day').startOf('minute').unix()
      case TimePeriod.WEEK:
        return utcCurrentTime.subtract(1, 'week').startOf('hour').unix()
      case TimePeriod.MONTH:
        return utcCurrentTime.subtract(1, 'month').startOf('hour').unix()
      case TimePeriod.YEAR:
        return utcCurrentTime.subtract(1, 'year').startOf('day').unix()
    }
  }, [timePeriod, utcCurrentTime])

  const qtyDataPerTime = useMemo(() => {
    switch (timePeriod) {
      case TimePeriod.DAY:
        return 24
      case TimePeriod.WEEK:
        return 168
      case TimePeriod.MONTH:
        return 730
      case TimePeriod.YEAR:
        return 8760
    }
  }, [timePeriod])

  const [data, setData] = useState<PriceChartEntry[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await fetchTokenPriceData(tokenData.address, ONE_HOUR_SECONDS, startTimestamp, qtyDataPerTime)
      setData(data)
    }

    fetchData()
  }, [qtyDataPerTime, startTimestamp, tokenData.address])

  const priceHistory = useMemo(() => {
    const currentPrice = tokenData?.priceUSD

    const pricePoint: PricePoint[] = data.map((price) => ({
      timestamp: price.time,
      value: price.close,
    }))

    if (currentPrice !== undefined) {
      const timestamp = Date.now() / 1000
      return [...pricePoint, { timestamp, value: currentPrice }]
    }
    return pricePoint
  }, [data, tokenData?.priceUSD])

  return priceHistory
}

export default function ChartSection({
  tokenData,
  onChangeTimePeriod,
}: {
  tokenData?: TokenData
  onChangeTimePeriod: OnChangeTimePeriod
}) {
  if (!tokenData) {
    return <LoadingChart />
  }

  return (
    <Suspense fallback={<LoadingChart />}>
      <ChartContainer>
        <Chart tokenData={tokenData} onChangeTimePeriod={onChangeTimePeriod} />
      </ChartContainer>
    </Suspense>
  )
}

export type OnChangeTimePeriod = (t: TimePeriod) => void
function Chart({ tokenData, onChangeTimePeriod }: { tokenData: TokenData; onChangeTimePeriod: OnChangeTimePeriod }) {
  const timePeriod = useAtomValue(pageTimePeriodAtom)

  const prices = usePriceHistory(tokenData, timePeriod)
  // Initializes time period to global & maintain separate time period for subsequent changes

  return (
    <ChartContainer data-testid="chart-container">
      <ParentSize>
        {({ width }) => <PriceChart prices={prices} width={width} height={436} timePeriod={timePeriod} />}
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
