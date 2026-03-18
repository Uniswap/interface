import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { ChartType } from '~/components/Charts/utils'
import { EXPLORE_CHART_HEIGHT_PX } from '~/components/Explore/constants'

export function LoadingChart() {
  return <ChartSkeleton dim type={ChartType.PRICE} height={EXPLORE_CHART_HEIGHT_PX} />
}
