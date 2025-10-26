import { SwipeableCardStack } from 'ui/src'
import { isExtensionApp } from 'utilities/src/platform'
import { IntroCard, IntroCardProps } from 'wallet/src/components/introCards/IntroCard'

type IntroCardStackProps = {
  cards: IntroCardProps[]

  onSwiped?: (card: IntroCardProps, index: number) => void
}

export const INTRO_CARD_MIN_HEIGHT = isExtensionApp ? 70 : 110

const keyExtractor = (card: IntroCardProps): string => {
  return card.title
}

const renderCard = (card: IntroCardProps): JSX.Element => {
  return <IntroCard {...card} />
}

export function IntroCardStack({ cards, onSwiped }: IntroCardStackProps): JSX.Element {
  return (
    <SwipeableCardStack
      cards={cards}
      keyExtractor={keyExtractor}
      minCardHeight={INTRO_CARD_MIN_HEIGHT}
      renderCard={renderCard}
      onSwiped={onSwiped}
    />
  )
}
