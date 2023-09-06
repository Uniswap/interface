import { Currency } from '@uniswap/sdk-core'
import { ParentSize } from '@visx/responsive'
import { useWeb3React } from '@web3-react/core'
import { useAllActivities } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { Activity } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { ChartContainer, LoadingChart } from 'components/Tokens/TokenDetails/Skeleton'
import { TokenPriceQuery } from 'graphql/data/TokenPrice'
import { gqlToCurrency, isPricePoint, PricePoint } from 'graphql/data/util'
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

const TOKEN_ACTIVITIES = ['Swapped', 'Sent', 'Received']

function activityIncludesCurrency(activity: Activity, currency: Currency): boolean {
  return activity.currencies?.some((_currency) => _currency?.equals(currency)) ?? false
}

function useTokenActivity(account?: string, currency?: Currency, types: string[] = TOKEN_ACTIVITIES): Activity[] {
  const { activities } = useAllActivities(account ?? '')

  return useMemo(() => {
    if (!account || !activities || !currency) return []

    return activities.filter(
      (activity) => activityIncludesCurrency(activity, currency) && types.includes(activity.title)
    )
  }, [account, activities, currency, types])
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
  const { account } = useWeb3React()
  const currency = tokenPriceQuery.token ? gqlToCurrency(tokenPriceQuery.token) : undefined
  const activity = useTokenActivity(account, currency)
  console.log('cartcrom', activity)
  // Initializes time period to global & maintain separate time period for subsequent changes
  const timePeriod = useAtomValue(pageTimePeriodAtom)

  return (
    <ChartContainer data-testid="chart-container">
      <ParentSize>
        {({ width }) => (
          <PriceChart prices={prices ?? null} activity={activity} width={width} height={436} timePeriod={timePeriod} />
        )}
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
