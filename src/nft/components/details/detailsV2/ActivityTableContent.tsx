import { TimestampedAmount } from 'graphql/data/__generated__/types-and-hooks'

import { ActivityPriceChart } from './ActivityPriceChart'
import { ActivityRows } from './ActivityRows'
import mockDataMonth from './mockPriceHistoryData/month.json'
import mockDataWeek from './mockPriceHistoryData/week.json'
import mockDataYear from './mockPriceHistoryData/year.json'
import { TableContentContainer } from './shared'

export const ActivityTableContent = () => {
  const priceDataMonth = mockDataMonth.priceHistory as TimestampedAmount[]
  const priceDataWeek = mockDataWeek.priceHistory as TimestampedAmount[]
  const priceDataYear = mockDataYear.priceHistory as TimestampedAmount[]
  return (
    <TableContentContainer>
      <ActivityPriceChart />
      <ActivityRows />
    </TableContentContainer>
  )
}
