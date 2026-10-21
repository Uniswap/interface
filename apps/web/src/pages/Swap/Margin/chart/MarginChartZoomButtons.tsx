import { Flex, TouchableArea, type TouchableAreaProps } from '@universe/mycelium'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { Expand } from 'ui/src/components/icons/Expand'
import { SearchMinus } from 'ui/src/components/icons/SearchMinus'
import { SearchPlus } from 'ui/src/components/icons/SearchPlus'
import { MAX_VERTICAL_ZOOM_STEP } from '~/pages/Swap/Margin/chart/verticalZoom'

// House zoom-pill segment (D3LiquidityChartShared/ZoomButtons idiom), py $spacing4 so the pill
// matches the height of the adjacent size-small segmented controls.
function ZoomSegment({ children, ...props }: TouchableAreaProps): JSX.Element {
  return (
    <TouchableArea
      style={{ transition: `opacity ${SPORE_ANIMATION_CURVE_CSS['100ms']}` }}
      backgroundColor="$transparent"
      hoverStyle={{ backgroundColor: '$transparent', opacity: 0.8 }}
      pressStyle={{ backgroundColor: '$surface3', opacity: 0.8 }}
      alignItems="center"
      justifyContent="center"
      borderColor="$surface3"
      borderWidth="$spacing1"
      px="$spacing8"
      py="$spacing4"
      {...props}
    >
      {children}
    </TouchableArea>
  )
}

// Vertical-axis zoom pill: − / fit-all / + step the pane's zoom level between the default
// fit-everything view (step 0) and pure candle-fit (MAX_VERTICAL_ZOOM_STEP). Zoom-in is disabled
// when the chart has no overlay bounds to zoom away (already candle-fit).
export function MarginChartZoomButtons({
  step,
  zoomAvailable,
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  step: number
  zoomAvailable: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex row centered borderRadius="$roundedFull">
      <ZoomSegment
        disabled={step === 0}
        borderTopLeftRadius="$roundedFull"
        borderBottomLeftRadius="$roundedFull"
        onPress={onZoomOut}
        aria-label={t('margin.chart.zoom.out')}
        testID={TestID.MarginChartZoomOut}
      >
        <SearchMinus size={16} color="$neutral1" />
      </ZoomSegment>
      <ZoomSegment
        disabled={step === 0}
        borderRadius="$none"
        borderLeftWidth={0}
        borderRightWidth={0}
        onPress={onReset}
        aria-label={t('margin.chart.zoom.reset')}
        testID={TestID.MarginChartZoomReset}
      >
        <Expand size={16} color="$neutral1" />
      </ZoomSegment>
      <ZoomSegment
        disabled={!zoomAvailable || step === MAX_VERTICAL_ZOOM_STEP}
        borderTopRightRadius="$roundedFull"
        borderBottomRightRadius="$roundedFull"
        onPress={onZoomIn}
        aria-label={t('margin.chart.zoom.in')}
        testID={TestID.MarginChartZoomIn}
      >
        <SearchPlus size={16} color="$neutral1" />
      </ZoomSegment>
    </Flex>
  )
}
