import { useEffect } from 'react'
import { SwipeableCardStack } from 'ui/src'
import { isExtensionApp } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'
import { IntroCard, IntroCardProps } from 'wallet/src/components/introCards/IntroCard'

type IntroCardStackProps = {
  cards: IntroCardProps[]
  onSwiped?: (card: IntroCardProps, index: number) => void
  onNotificationShown?: (cardId: string) => void
}

export const INTRO_CARD_MIN_HEIGHT = isExtensionApp ? 70 : 110

const keyExtractor = (card: IntroCardProps): string => {
  return card.id ?? card.title
}

const renderCard = (card: IntroCardProps): JSX.Element => {
  return <IntroCard {...card} />
}

export function IntroCardStack({ cards, onSwiped, onNotificationShown }: IntroCardStackProps): JSX.Element {
  const topCardId = cards[0]?.id

  const handleNotificationShown = useEvent((id: string) => {
    onNotificationShown?.(id)
  })

  useEffect(() => {
    if (topCardId) {
      handleNotificationShown(topCardId)
    }
  }, [topCardId, handleNotificationShown])

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
