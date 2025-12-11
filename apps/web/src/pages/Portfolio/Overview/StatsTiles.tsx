import { ValueWithFadedDecimals } from 'pages/Portfolio/components/ValueWithFadedDecimals/ValueWithFadedDecimals'
import { useSwapsThisWeek } from 'pages/Portfolio/Overview/hooks/useSwapsThisWeek'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text, useMedia } from 'ui/src'
import { ActivityRenderData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

const BORDER_COLOR = '$surface3'
const BORDER_WIDTH = 1

const StatsGroup1 = styled(Flex, {
  flexDirection: 'row',
  variants: {
    singleRow: {
      true: {
        width: '100%',
      },
    },
  } as const,
})

interface OverviewStatsTilesProps {
  activityData: ActivityRenderData
}

export const OverviewStatsTiles = memo(function OverviewStatsTiles({ activityData }: OverviewStatsTilesProps) {
  const { t } = useTranslation()
  const media = useMedia()
  const isSingleRow = !!media.xl && !media.md
  const { count: swapCount, totalVolumeUSD, isLoading } = useSwapsThisWeek(activityData)
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const hasVolumeData = totalVolumeUSD > 0

  return (
    <Flex
      borderWidth={BORDER_WIDTH}
      borderColor={BORDER_COLOR}
      borderRadius="$rounded16"
      overflow="hidden"
      width="100%"
    >
      <StatsGroup1 singleRow={isSingleRow}>
        <Flex borderRightWidth={BORDER_WIDTH} borderColor={BORDER_COLOR} padding="$spacing16" width="50%">
          <Text variant="body3" color="$neutral2">
            {t('portfolio.overview.stats.swapsThisWeek')}
          </Text>
          <Text variant="heading3" loading={isLoading} color="$neutral1">
            {swapCount}
          </Text>
        </Flex>
        <Flex padding="$spacing16" width="50%">
          <Text variant="body3" color="$neutral2">
            {t('portfolio.overview.stats.swappedThisWeek')}
          </Text>
          <ValueWithFadedDecimals
            textProps={{ variant: 'heading3', color: '$neutral1' }}
            value={convertFiatAmountFormatted(hasVolumeData ? totalVolumeUSD : 0, NumberType.PortfolioBalance)}
          />
        </Flex>
      </StatsGroup1>
    </Flex>
  )
})
