import { useCallback, useEffect, useState } from 'react'
import { Flex } from 'ui/src/components/layout'
import { SWIPEABLE_CARD_Y_OFFSET } from 'ui/src/components/swipeablecards/BaseCard'
import { PickedCardProps, SwipeableCardStackProps } from 'ui/src/components/swipeablecards/props'
import { SwipeableCard } from 'ui/src/components/swipeablecards/SwipeableCard'
import { usePrevious } from 'utilities/src/react/hooks'

// Extra padding at the bottom of the container to prevent card shadows from being clipped
const SHADOW_OVERFLOW_PADDING = 8

export function BaseSwipeableCardStack<T extends PickedCardProps>({
  cards,
  minCardHeight = 0,
  renderCard,
  keyExtractor,
  onSwiped,
}: SwipeableCardStackProps<T>): JSX.Element {
  const firstCard = cards[0]
  const [activeKey, setActiveKey] = useState(firstCard ? keyExtractor(firstCard) : '')

  // Track heights per card key for bottom-anchored positioning
  const [cardHeights, setCardHeights] = useState<Record<string, number>>({})

  // Calculate active card's height
  const activeCardHeight = cardHeights[activeKey] || minCardHeight

  // Container height = active card + peek area for behind cards + shadow padding
  const containerHeight = activeCardHeight + (cards.length - 1) * SWIPEABLE_CARD_Y_OFFSET + SHADOW_OVERFLOW_PADDING

  // Stable container height that only grows during press/swipe animations to prevent layout shift.
  // When a press animation briefly reduces the measured card height, the container must not shrink —
  // that would push the UI below upward. We reset only when cards are actually added/removed.
  const prevCardsLength = usePrevious(cards.length)
  const [stableContainerHeight, setStableContainerHeight] = useState(containerHeight)
  useEffect(() => {
    if (prevCardsLength !== undefined && prevCardsLength !== cards.length) {
      // A card was dismissed or added — allow the height to recalculate freely
      setStableContainerHeight(containerHeight)
    } else {
      // During animations, only allow height to grow, never shrink
      setStableContainerHeight((prev) => Math.max(prev, containerHeight))
    }
  }, [containerHeight, prevCardsLength, cards.length])

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

  // Track height by card key for bottom-anchored positioning
  const handleLayout = useCallback(
    (key: string) =>
      ({ height }: { height: number; yOffset: number }) => {
        setCardHeights((prev) => {
          if (prev[key] === height) {
            return prev
          }
          return { ...prev, [key]: height }
        })
      },
    [],
  )

  return (
    <Flex position="relative" overflow="hidden" style={{ height: stableContainerHeight }}>
      {cards.map((card, index) => {
        const key = keyExtractor(card)
        const stackIndex = (index - activeIndex + cards.length) % cards.length

        return (
          <Flex
            key={key}
            position="absolute"
            width="100%"
            zIndex={cards.length - stackIndex}
            pointerEvents={stackIndex === 0 ? 'auto' : 'none'}
          >
            <SwipeableCard
              activeCardHeight={activeCardHeight}
              cardHeight={cardHeights[key] || minCardHeight}
              disableSwipe={cards.length <= 1 || activeIndex !== index}
              stackIndex={stackIndex}
              onLayout={handleLayout(key)}
              onPress={stackIndex === 0 ? card.onPress : undefined}
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
