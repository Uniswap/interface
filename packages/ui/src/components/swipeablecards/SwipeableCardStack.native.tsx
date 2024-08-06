import { useCallback, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Flex } from 'ui/src/components/layout'
import { SwipeableCard } from 'ui/src/components/swipeablecards/SwipeableCard'
import { SwipeableCardStackProps } from 'ui/src/components/swipeablecards/props'

export function SwipeableCardStack<T>({ cards, renderCard, onSwiped }: SwipeableCardStackProps<T>): JSX.Element {
  const [activeIndex, setActiveIndex] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const [cardHeight, setCardHeight] = useState(0)

  const handleSwiped = useCallback(() => {
    setActiveIndex((prev) => {
      const next = prev === cards.length - 1 ? 0 : prev + 1
      onSwiped?.(next)
      return next
    })
  }, [cards.length, onSwiped])

  const handleLayout = useCallback(
    ({ height, yOffset }: { height: number; yOffset: number }) => {
      setContainerHeight(Math.max(containerHeight, height + yOffset))
      setCardHeight(Math.max(cardHeight, height))
    },
    [cardHeight, containerHeight],
  )

  return (
    <GestureHandlerRootView>
      <Flex position="relative" style={{ height: containerHeight }}>
        {cards.map((card, index) => {
          const stackIndex = (index - activeIndex + cards.length) % cards.length
          return (
            <Flex key={index} position="absolute" width="100%" zIndex={cards.length - stackIndex}>
              <SwipeableCard
                cardHeight={cardHeight}
                disableSwipe={cards.length <= 1}
                stackIndex={stackIndex}
                onLayout={handleLayout}
                onSwiped={handleSwiped}
              >
                {renderCard(card, stackIndex)}
              </SwipeableCard>
            </Flex>
          )
        })}
      </Flex>
    </GestureHandlerRootView>
  )
}
