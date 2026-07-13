import { TouchableArea, Flex } from 'ui/src'
import { TrendUp } from 'ui/src/components/icons/TrendUp'

interface SwapChartToggleButtonProps {
  showChart: boolean
  onPress: () => void
}

export function SwapChartToggleButton({ showChart, onPress }: SwapChartToggleButtonProps): JSX.Element {
  return (
    <TouchableArea
      centered
      width={32}
      height={32}
      borderRadius="$rounded8"
      backgroundColor={showChart ? '$surface3' : undefined}
      hoverStyle={{ backgroundColor: '$surface2' }}
      onPress={onPress}
    >
      <Flex animation="fast" animateOnly={['transform']} hoverStyle={{ scale: 1.1 }}>
        <TrendUp color={showChart ? '$neutral1' : '$neutral2'} size="$icon.24" />
      </Flex>
    </TouchableArea>
  )
}
