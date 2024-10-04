import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { BaseSwipeableCardStack } from 'ui/src/components/swipeablecards/BaseSwipeableCardStack'
import { PickedCardProps, SwipeableCardStackProps } from 'ui/src/components/swipeablecards/props'

export function SwipeableCardStack<T extends PickedCardProps>({
  cards,
  minCardHeight = 0,
  renderCard,
  keyExtractor,
  onSwiped,
}: SwipeableCardStackProps<T>): JSX.Element {
  return (
    <GestureHandlerRootView>
      <BaseSwipeableCardStack
        cards={cards}
        keyExtractor={keyExtractor}
        renderCard={renderCard}
        minCardHeight={minCardHeight}
        onSwiped={onSwiped}
      />
    </GestureHandlerRootView>
  )
}
