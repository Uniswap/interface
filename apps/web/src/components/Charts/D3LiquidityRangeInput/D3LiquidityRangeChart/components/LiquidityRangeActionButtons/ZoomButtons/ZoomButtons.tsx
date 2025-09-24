import { useChartPriceState } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/priceSelectors'
import { useLiquidityChartStoreActions } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/useLiquidityChartStore'
import { Flex, TouchableArea, TouchableAreaProps } from 'ui/src'
import { Expand } from 'ui/src/components/icons/Expand'
import { SearchMinus } from 'ui/src/components/icons/SearchMinus'
import { SearchPlus } from 'ui/src/components/icons/SearchPlus'

const ZoomOptionButton = ({ children, ...props }: TouchableAreaProps) => {
  return (
    <TouchableArea
      animation="100ms"
      backgroundColor="$transparent"
      hoverStyle={{ backgroundColor: '$transparent', opacity: 0.8 }}
      pressStyle={{ backgroundColor: '$surface3', opacity: 0.8 }}
      alignItems="center"
      justifyContent="center"
      borderColor="$surface3"
      borderWidth="$spacing1"
      p="$spacing8"
      {...props}
    >
      {children}
    </TouchableArea>
  )
}

export function ZoomButtons() {
  const { zoomIn, centerRange, zoomOut } = useLiquidityChartStoreActions()
  const { isFullRange } = useChartPriceState()
  return (
    <Flex row centered borderRadius="$roundedFull">
      <ZoomOptionButton borderTopLeftRadius="$roundedFull" borderBottomLeftRadius="$roundedFull" onPress={zoomOut}>
        <SearchMinus size={16} color="$neutral1" />
      </ZoomOptionButton>
      <ZoomOptionButton
        disabled={isFullRange}
        borderRadius="$none"
        borderLeftWidth={0}
        borderRightWidth={0}
        onPress={centerRange}
      >
        <Expand size={16} color="$neutral1" />
      </ZoomOptionButton>
      <ZoomOptionButton borderTopRightRadius="$roundedFull" borderBottomRightRadius="$roundedFull" onPress={zoomIn}>
        <SearchPlus size={16} color="$neutral1" />
      </ZoomOptionButton>
    </Flex>
  )
}
