import { BaseCard } from 'ui/src/components/swipeablecards/BaseCard'
import { SwipeableCardProps } from 'ui/src/components/swipeablecards/props'
import { TouchableArea } from 'ui/src/components/touchable'

export function SwipeableCard({
  children,
  stackIndex,
  cardHeight,
  activeCardHeight,
  onPress,
  onLayout,
}: SwipeableCardProps): JSX.Element {
  return (
    <TouchableArea activeOpacity={1} onPress={onPress}>
      <BaseCard stackIndex={stackIndex} cardHeight={cardHeight} activeCardHeight={activeCardHeight} onLayout={onLayout}>
        {children}
      </BaseCard>
    </TouchableArea>
  )
}
