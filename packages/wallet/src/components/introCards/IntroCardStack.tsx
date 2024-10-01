import { SwipeableCardStack } from 'ui/src/components/swipeablecards/SwipeableCardStack'
import { isExtension } from 'utilities/src/platform'
import { IntroCard, IntroCardProps } from 'wallet/src/components/introCards/IntroCard'

export type IntroCardWrapper = IntroCardProps & { onPress?: () => void }

type IntroCardStackProps = {
  cards: IntroCardWrapper[]

  onSwiped?: (card: IntroCardProps, index: number) => void
}

export const INTRO_CARD_MIN_HEIGHT = isExtension ? 84 : 110

export function IntroCardStack({ cards, onSwiped }: IntroCardStackProps): JSX.Element {
  return (
    <SwipeableCardStack
      cards={cards}
      keyExtractor={(card) => card.title}
      minCardHeight={INTRO_CARD_MIN_HEIGHT}
      renderCard={(card) => <IntroCard {...card} />}
      onSwiped={onSwiped}
    />
  )
}
