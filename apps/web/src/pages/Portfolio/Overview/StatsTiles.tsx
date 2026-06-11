import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { ActivityRenderData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useSwapsThisWeek } from '~/pages/Portfolio/Overview/hooks/useSwapsThisWeek'

interface OverviewStatsTilesProps {
  activityData: ActivityRenderData
}

export const OverviewStatsTiles = memo(function OverviewStatsTiles({ activityData }: OverviewStatsTilesProps) {
  const { t } = useTranslation()
  const { count: swapCount, isLoading } = useSwapsThisWeek(activityData)

  return (
    <Flex borderWidth={1} borderColor="$surface3" borderRadius="$rounded16" overflow="hidden" width="100%">
      <Flex padding="$spacing16" data-testid={TestID.PortfolioOverviewStatsSwapsThisWeek}>
        <Text variant="body3" color="$neutral2">
          {t('portfolio.overview.stats.swapsThisWeek')}
        </Text>
        <Text variant="heading3" loading={isLoading} color="$neutral1">
          {swapCount}
        </Text>
      </Flex>
    </Flex>
  )
})
