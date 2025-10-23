import { SwipeableCardStack } from 'ui/src'
import { isExtensionApp } from 'utilities/src/platform'
import { IntroCard, IntroCardProps } from 'wallet/src/components/introCards/IntroCard'

type IntroCardStackProps = {
  cards: IntroCardProps[]

  onSwiped?: (card: IntroCardProps, index: number) => void
}

export const INTRO_CARD_MIN_HEIGHT = isExtensionApp ? 70 : 110

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
