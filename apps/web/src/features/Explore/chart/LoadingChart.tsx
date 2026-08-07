import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { ChartType } from '~/components/Charts/utils'
import { EXPLORE_CHART_HEIGHT_PX } from '~/features/Explore/constants'

export function LoadingChart() {
  return <ChartSkeleton type={ChartType.PRICE} height={EXPLORE_CHART_HEIGHT_PX} />
}
