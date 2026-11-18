import { Flex, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import type { ChartHoverCoordinates } from '~/components/Charts/ChartModel'
import type { SingleHistogramData } from '~/components/Charts/VolumeChart/utils'

// Below the chart's price header, near the top of the plot, as in the Figma.
const TOOLTIP_TOP_PX = 88
const TOOLTIP_OFFSET_PX = 12
// Past this share of the plot the box sits left of the crosshair, so it doesn't run under the price axis.
const FLIP_SHARE = 0.65

function Row({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <Flex row justifyContent="space-between" gap="$gap24">
      <Text variant="body4" color="$neutral2">
        {label}
      </Text>
      <Text variant="body4">{value}</Text>
    </Flex>
  )
}

/** The hovered volume bar's volume and fees, beside the crosshair. */
export function VolumeHoverTooltip({
  bar,
  hover,
}: {
  bar: SingleHistogramData
  hover: ChartHoverCoordinates
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const flip = hover.plotRightEdge !== undefined && hover.x > hover.plotRightEdge * FLIP_SHARE
  return (
    <Flex
      position="absolute"
      pointerEvents="none"
      zIndex="$mask"
      top={TOOLTIP_TOP_PX}
      backgroundColor="$surface1"
      borderWidth="$spacing1"
      borderColor="$surface3"
      borderRadius="$rounded12"
      px="$spacing12"
      py="$spacing8"
      gap="$gap4"
      style={{
        left: hover.x,
        transform: `translateX(${flip ? `calc(-100% - ${TOOLTIP_OFFSET_PX}px)` : `${TOOLTIP_OFFSET_PX}px`})`,
      }}
    >
      <Row label={t('common.volume')} value={convertFiatAmountFormatted(bar.value, NumberType.FiatTokenStats)} />
      {bar.feesUsd !== undefined && (
        <Row label={t('common.fees')} value={convertFiatAmountFormatted(bar.feesUsd, NumberType.FiatTokenStats)} />
      )}
    </Flex>
  )
}
