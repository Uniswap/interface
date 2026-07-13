import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { ChartBarCrossed } from 'ui/src/components/icons/ChartBarCrossed'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { ChartType } from '~/components/Charts/utils'

interface ChartUnavailableOverlayProps {
  height: number
  chartTransform?: string
  type?: ChartType
}

/** Dimmed chart skeleton with a "Chart unavailable" banner, shown when a chart has loaded but has no usable data series. */
export function ChartUnavailableOverlay({
  height,
  chartTransform,
  type = ChartType.PRICE,
}: ChartUnavailableOverlayProps): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex position="relative" width="100%">
      <ChartSkeleton
        type={type}
        height={height}
        hideYAxis
        hideXAxis
        hidePriceIndicators
        chartTransform={chartTransform}
      />
      <Flex
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        row
        alignItems="center"
        gap="$gap4"
        px="$spacing8"
        py="$spacing6"
        borderRadius="$rounded8"
        backgroundColor="$surface3"
        backdropFilter="blur(2px)"
      >
        <ChartBarCrossed size="$icon.16" color="$neutral2" />
        <Text variant="body4" color="$neutral2" whiteSpace="nowrap">
          {t('chart.unavailable')}
        </Text>
      </Flex>
    </Flex>
  )
}
