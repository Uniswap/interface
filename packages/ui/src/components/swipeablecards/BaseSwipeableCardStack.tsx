import { useCallback, useState } from 'react'
import { Flex } from 'ui/src/components/layout'
import { SWIPEABLE_CARD_Y_OFFSET } from 'ui/src/components/swipeablecards/BaseCard'
import { PickedCardProps, SwipeableCardStackProps } from 'ui/src/components/swipeablecards/props'
import { SwipeableCard } from 'ui/src/components/swipeablecards/SwipeableCard'
import { usePrevious } from 'utilities/src/react/hooks'

export function BaseSwipeableCardStack<T extends PickedCardProps>({
  cards,
  minCardHeight = 0,
  renderCard,
  keyExtractor,
  onSwiped,
}: SwipeableCardStackProps<T>): JSX.Element {
  const firstCard = cards[0]
  const [activeKey, setActiveKey] = useState(firstCard ? keyExtractor(firstCard) : '')

  const [containerHeight, setContainerHeight] = useState(minCardHeight + (cards.length - 1) * SWIPEABLE_CARD_Y_OFFSET)
  const [cardHeight, setCardHeight] = useState(minCardHeight)

  // Uses active key to track first card for when cards are removed
  // If the active card is removed, the next card becomes active or will default to the first card
  const keyIndex = cards.findIndex((card) => keyExtractor(card) === activeKey)
  const prevIndex = usePrevious(keyIndex)
  const activeIndex = keyIndex >= 0 ? keyIndex : prevIndex ? prevIndex + 1 : 0

  const handleSwiped = useCallback(
    (card: T, index: number) => {
      const nextIndex = activeIndex === cards.length - 1 ? 0 : activeIndex + 1
      const nextCard = cards[nextIndex]
      const nextKey = nextCard ? keyExtractor(nextCard) : ''

      setActiveKey(nextKey)

      onSwiped?.(card, index)
    },
    [activeIndex, cards, keyExtractor, onSwiped],
  )

  const handleLayout = useCallback(({ height, yOffset }: { height: number; yOffset: number }) => {
    setContainerHeight((prev) => Math.max(prev, height + yOffset))
    setCardHeight((prev) => Math.max(prev, height))
  }, [])

  return (
    <Flex position="relative" style={{ height: containerHeight }}>
      {cards.map((card, index) => {
        const stackIndex = (index - activeIndex + cards.length) % cards.length

        return (
          <Flex key={index} position="absolute" width="100%" zIndex={cards.length - stackIndex}>
            <SwipeableCard
              cardHeight={cardHeight}
              disableSwipe={cards.length <= 1 || activeIndex !== index}
              stackIndex={stackIndex}
              onLayout={handleLayout}
              onPress={card.onPress}
              onSwiped={() => handleSwiped(card, index)}
            >
              {renderCard(card, stackIndex)}
            </SwipeableCard>
          </Flex>
        )
      })}
    </Flex>
  )
}
