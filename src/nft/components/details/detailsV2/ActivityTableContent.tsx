import { ActivityPriceChart } from './ActivityPriceChart'
import { ActivityRows } from './ActivityRows'
import { TableContentContainer } from './shared'

export const ActivityTableContent = () => {
  return (
    <TableContentContainer>
      <ActivityPriceChart />
      <ActivityRows />
    </TableContentContainer>
  )
}
