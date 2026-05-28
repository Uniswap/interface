import { BaseCard } from 'ui/src/components/swipeablecards/BaseCard'
import { SwipeableCardProps } from 'ui/src/components/swipeablecards/props'
import { TouchableArea } from 'ui/src/components/touchable'

export function SwipeableCard({
  children,
  stackIndex,
  cardHeight,
  onPress,
  onLayout,
}: SwipeableCardProps): JSX.Element {
  return (
    <TouchableArea onPress={onPress}>
      <BaseCard stackIndex={stackIndex} cardHeight={cardHeight} onLayout={onLayout}>
        {children}
      </BaseCard>
    </TouchableArea>
  )
}
