import { IntroCard, IntroCardProps } from 'src/components/home/introCards/IntroCard'
import { SwipeableCardStack } from 'ui/src/components/swipeablecards/SwipeableCardStack'

type IntroCardStackProps = {
  cards: IntroCardProps[]

  keyExtractor: (card: IntroCardProps) => string
  onSwiped?: (card: IntroCardProps, index: number) => void
}

const MIN_CARD_HEIGHT = 110

export function IntroCardStack({ cards, keyExtractor, onSwiped }: IntroCardStackProps): JSX.Element {
  return (
    <SwipeableCardStack
      cards={cards}
      keyExtractor={keyExtractor}
      minCardHeight={MIN_CARD_HEIGHT}
      renderCard={(card) => <IntroCard {...card} />}
      onSwiped={onSwiped}
    />
  )
}
