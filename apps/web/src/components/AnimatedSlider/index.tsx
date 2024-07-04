import { Children, ReactNode } from 'react'
import { AnimatePresence, Flex, styled } from 'ui/src'

type SlideDirection = 'forward' | 'backward'

const AnimatedItem = styled(Flex, {
  zIndex: 100,
  x: 0,
  opacity: 1,
  width: '100%',

  variants: {
    going: {
      ':string': (going: string) => ({
        enterStyle: {
          x: going === 'forward' ? 10 : -10,
          opacity: 0,
        },
        exitStyle: {
          zIndex: 0,
          x: going === 'forward' ? -10 : 10,
          opacity: 0,
        },
      }),
    },
  } as const,
})

export function AnimatedSlider({
  currentIndex,
  slideDirection = 'forward',
  children,
}: {
  currentIndex: number
  children: ReactNode
  slideDirection?: SlideDirection
}) {
  const arrayChildren = Children.toArray(children)

  return (
    <AnimatePresence initial={false} custom={{ going: slideDirection }} exitBeforeEnter>
      <AnimatedItem key={`slide-item-${currentIndex}`} animation="200ms" going={slideDirection}>
        {arrayChildren[currentIndex]}
      </AnimatedItem>
    </AnimatePresence>
  )
}
