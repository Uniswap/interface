import { HistoryDuration, TimestampedAmount } from 'graphql/data/__generated__/types-and-hooks'

interface ActivityPriceChartProps {
  width: number
  height: number
  prices?: TimestampedAmount[]
  timePeriod: HistoryDuration
}
// TODO: use @visx Areas https://airbnb.io/visx/areas
export const ActivityPriceChart = () => {
  return <div>Activity Price Chart</div>
}
