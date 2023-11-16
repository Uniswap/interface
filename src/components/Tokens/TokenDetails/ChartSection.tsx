import { ParentSize } from '@visx/responsive'
import { ChartType } from 'components/Charts/utils'
import { LoadingChart } from 'components/Tokens/TokenDetails/Skeleton'
import { useInfoTDPEnabled } from 'featureFlags/flags/infoTDP'
import { TokenPriceQuery } from 'graphql/data/TokenPrice'
import { isPricePoint, PricePoint } from 'graphql/data/util'
import { useAtomValue } from 'jotai/utils'
import { pageTimePeriodAtom } from 'pages/TokenDetails'
import { Suspense, useMemo } from 'react'
import styled from 'styled-components'

import { PriceChart } from '../../Charts/PriceChart'
import TimePeriodSelector from './TimeSelector'

export const ChartContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 436px;
  margin-bottom: 24px;
  align-items: flex-start;
  width: 100%;
`

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
  chartType,
  tokenPriceQuery,
}: {
  chartType: ChartType
  tokenPriceQuery?: TokenPriceQuery
}) {
  if (!tokenPriceQuery) {
    return <LoadingChart />
  }

  return (
    <Suspense fallback={<LoadingChart />}>
      <ChartContainer data-testid="chart-container">
        <Chart chartType={chartType} tokenPriceQuery={tokenPriceQuery} />
        <TimePeriodSelector />
      </ChartContainer>
    </Suspense>
  )
}

function Chart({ chartType, tokenPriceQuery }: { chartType: ChartType; tokenPriceQuery: TokenPriceQuery }) {
  const isInfoTDPEnabled = useInfoTDPEnabled()
  const prices = usePriceHistory(tokenPriceQuery)
  const timePeriod = useAtomValue(pageTimePeriodAtom)

  return (
    <ParentSize>
      {({ width }) => {
        if (isInfoTDPEnabled) {
          switch (chartType) {
            // TODO: Update to correct chart when built
            case ChartType.VOLUME:
              return <PriceChart prices={prices} width={width} height={392} timePeriod={timePeriod} />
            case ChartType.TVL:
              return <PriceChart prices={prices} width={width} height={392} timePeriod={timePeriod} />
            default:
              return <PriceChart prices={prices} width={width} height={392} timePeriod={timePeriod} />
          }
        } else {
          return <PriceChart prices={prices} width={width} height={392} timePeriod={timePeriod} />
        }
      }}
    </ParentSize>
  )
}
