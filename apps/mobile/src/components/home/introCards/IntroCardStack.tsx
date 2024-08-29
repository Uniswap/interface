import { IntroCard, IntroCardProps } from 'src/components/home/introCards/IntroCard'
import { SwipeableCardStack } from 'ui/src/components/swipeablecards/SwipeableCardStack'

type IntroCardStackProps = {
  cards: IntroCardProps[]

  keyExtractor: (card: IntroCardProps) => string
  onSwiped?: (card: IntroCardProps, index: number) => void
}
export function IntroCardStack({ cards, keyExtractor, onSwiped }: IntroCardStackProps): JSX.Element {
  return (
    <SwipeableCardStack
      cards={cards}
      keyExtractor={keyExtractor}
      renderCard={(card) => <IntroCard {...card} />}
      onSwiped={onSwiped}
    />
  )
}
