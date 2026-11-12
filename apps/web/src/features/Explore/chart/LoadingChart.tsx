import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { EXPLORE_CHART_HEIGHT_PX } from '~/features/Explore/constants'
import { ChartType } from '~/utils/charts'

export function LoadingChart() {
  return <ChartSkeleton type={ChartType.PRICE} height={EXPLORE_CHART_HEIGHT_PX} />
}
