import { Flex, TouchableArea, type TouchableAreaProps } from 'ui/src'
import { Expand } from 'ui/src/components/icons/Expand'
import { SearchMinus } from 'ui/src/components/icons/SearchMinus'
import { SearchPlus } from 'ui/src/components/icons/SearchPlus'

interface AuctionChartZoomControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  isResetDisabled?: boolean
  isZoomDisabled?: boolean
}

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
      px="$spacing8"
      py="$spacing4"
      {...props}
    >
      {children}
    </TouchableArea>
  )
}

export function AuctionChartZoomControls({
  onZoomIn,
  onZoomOut,
  onReset,
  isResetDisabled = false,
  isZoomDisabled = false,
}: AuctionChartZoomControlsProps): JSX.Element {
  return (
    <Flex row alignItems="center">
      <Flex row centered borderRadius="$roundedFull">
        <ZoomOptionButton
          disabled={isZoomDisabled}
          borderTopLeftRadius="$roundedFull"
          borderBottomLeftRadius="$roundedFull"
          onPress={onZoomOut}
        >
          <SearchMinus size={16} color="$neutral1" />
        </ZoomOptionButton>
        <ZoomOptionButton
          disabled={isZoomDisabled || isResetDisabled}
          borderRadius="$none"
          borderLeftWidth={0}
          borderRightWidth={0}
          onPress={onReset}
        >
          <Expand size={16} color="$neutral1" />
        </ZoomOptionButton>
        <ZoomOptionButton
          disabled={isZoomDisabled}
          borderTopRightRadius="$roundedFull"
          borderBottomRightRadius="$roundedFull"
          onPress={onZoomIn}
        >
          <SearchPlus size={16} color="$neutral1" />
        </ZoomOptionButton>
      </Flex>
    </Flex>
  )
}
